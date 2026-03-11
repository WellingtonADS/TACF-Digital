CREATE OR REPLACE FUNCTION public.confirmar_agendamento(
    p_user_id UUID,
    p_session_id UUID
)
RETURNS TABLE (
    success BOOLEAN,
    booking_id UUID,
    error TEXT,
    order_number TEXT
) AS $$
DECLARE
    v_session_date DATE;
    v_max_cap INTEGER;
    v_current_cap INTEGER;
    v_session_status public.session_status;
    v_semester public.semester_type;
    v_year INTEGER;
    v_next_order INTEGER;
    v_order_str TEXT;
    v_new_booking_id UUID;
    v_profile_active BOOLEAN;
BEGIN
    -- 1. Bloqueio pessimista e leitura da capacidade (O(1))
    SELECT starts_at::date AS date, max_capacity, capacity, status 
    INTO v_session_date, v_max_cap, v_current_cap, v_session_status
    FROM public.sessions 
    WHERE id = p_session_id 
    FOR UPDATE;

    -- 2. Validações de Negócio
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::UUID, 'session not found'::TEXT, NULL::TEXT;
        RETURN;
    END IF;

    IF v_session_status != 'open' THEN
        RETURN QUERY SELECT false, NULL::UUID, 'session not open'::TEXT, NULL::TEXT;
        RETURN;
    END IF;

    -- Verificação instantânea via Counter Cache
    IF v_current_cap >= v_max_cap THEN
        RETURN QUERY SELECT false, NULL::UUID, 'session full'::TEXT, NULL::TEXT;
        RETURN;
    END IF;

    -- 3. Verificação de Perfil
    SELECT active INTO v_profile_active FROM public.profiles WHERE id = p_user_id;
    IF v_profile_active IS NOT TRUE THEN
        RETURN QUERY SELECT false, NULL::UUID, 'profile inactive'::TEXT, NULL::TEXT;
        RETURN;
    END IF;

    -- 4. Cálculo de Semestre e Ano
    v_year := EXTRACT(YEAR FROM v_session_date);
    v_semester := CASE WHEN EXTRACT(MONTH FROM v_session_date) <= 6 THEN '1' ELSE '2' END;

    -- Evita duplicidade no mesmo semestre
    IF EXISTS (
        SELECT 1 FROM public.bookings 
        WHERE user_id = p_user_id 
        AND semester = v_semester 
        AND test_date >= DATE_TRUNC('year', v_session_date)
        AND status = 'agendado'
    ) THEN
        RETURN QUERY SELECT false, NULL::UUID, 'user already has booking this semester'::TEXT, NULL::TEXT;
        RETURN;
    END IF;

    -- 5. Geração Atómica do Número de Ordem
    INSERT INTO public.order_numbers (year, semester, last)
    VALUES (v_year, v_semester::text, 1)
    ON CONFLICT (year, semester) 
    DO UPDATE SET last = order_numbers.last + 1
    RETURNING last INTO v_next_order;

    v_order_str := v_year || '-' || v_semester || '-' || LPAD(v_next_order::TEXT, 4, '0');

    -- 6. Inserção Única (A trigger tr_sync_session_capacity atualizará a contagem)
    INSERT INTO public.bookings (
        user_id, 
        session_id, 
        status, 
        semester, 
        order_number, 
        test_date
    ) VALUES (
        p_user_id, 
        p_session_id, 
        'agendado', 
        v_semester, 
        v_order_str, 
        v_session_date
    ) RETURNING id INTO v_new_booking_id;

    RETURN QUERY SELECT true, v_new_booking_id, NULL::TEXT, v_order_str;

EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL::UUID, SQLERRM, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
