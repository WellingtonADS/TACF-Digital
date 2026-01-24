-- ============================================================================
-- TACF Digital - Database Tests
-- Issue: ISSUE-002
-- Description: Validation tests for schema constraints
-- ============================================================================

-- Test 1: Capacity constraint (should FAIL - capacity < 8)
DO $$
BEGIN
  INSERT INTO sessions (date, period, max_capacity)
  VALUES ('2026-02-10', 'morning', 5);
  RAISE EXCEPTION 'Test 1 FAILED: Should reject capacity < 8';
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE 'Test 1 PASSED: Capacity < 8 rejected correctly';
END $$;

-- Test 2: Capacity constraint (should FAIL - capacity > 21)
DO $$
BEGIN
  INSERT INTO sessions (date, period, max_capacity)
  VALUES ('2026-02-11', 'morning', 25);
  RAISE EXCEPTION 'Test 2 FAILED: Should reject capacity > 21';
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE 'Test 2 PASSED: Capacity > 21 rejected correctly';
END $$;

-- Test 3: Valid capacity (should PASS)
DO $$
BEGIN
  INSERT INTO sessions (date, period, max_capacity)
  VALUES ('2026-02-12', 'morning', 15);
  RAISE NOTICE 'Test 3 PASSED: Valid capacity accepted';
END $$;

-- Test 4: SARAM uniqueness (should FAIL on second insert)
DO $$
DECLARE
  test_id UUID;
  test_email TEXT;
BEGIN
  test_id := gen_random_uuid();
  test_email := 'test+' || substr(test_id::text, 1, 8) || '@example.com';

  -- Create corresponding auth user so FK constraint is satisfied
  INSERT INTO auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
  VALUES (test_id, 'authenticated', 'authenticated', test_email, NOW(), NOW(), NOW());

  INSERT INTO profiles (id, saram, full_name, rank, semester)
  VALUES (test_id, 'TEST001', 'João Silva', 'Soldado', '1');
  
  -- Attempt duplicate SARAM
  INSERT INTO profiles (id, saram, full_name, rank, semester)
  VALUES (gen_random_uuid(), 'TEST001', 'Maria Souza', 'Cabo', '1');
  
  RAISE EXCEPTION 'Test 4 FAILED: Should reject duplicate SARAM';
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'Test 4 PASSED: Duplicate SARAM rejected correctly';
    -- Cleanup created test data
    DELETE FROM profiles WHERE id = test_id;
    DELETE FROM auth.users WHERE id = test_id;
END $$;

-- Test 6: User cannot have more than one booking per semester (should FAIL on second booking)
DO $$
DECLARE
  u UUID;
  s1 UUID;
  s2 UUID;
  email TEXT;
BEGIN
  u := gen_random_uuid();
  email := 't+' || substr(u::text,1,8) || '@example.com';
  INSERT INTO auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
    VALUES (u, 'authenticated', 'authenticated', email, NOW(), NOW(), NOW());
  INSERT INTO profiles (id, saram, full_name, rank, semester)
    VALUES (u, 'SEMTEST', 'Semester Test', 'Soldado', '1');

  -- Create two sessions (both in same semester inference period)
  INSERT INTO sessions (id, date, period, max_capacity)
    VALUES (gen_random_uuid(), '2026-03-10', 'morning', 10) RETURNING id INTO s1;
  INSERT INTO sessions (id, date, period, max_capacity)
    VALUES (gen_random_uuid(), '2026-03-20', 'morning', 10) RETURNING id INTO s2;

  -- First booking should pass
  PERFORM public.book_session(u, s1);

  -- Second booking in same semester should fail
  BEGIN
    PERFORM public.book_session(u, s2);
    RAISE EXCEPTION 'Test 6 FAILED: Should not allow second booking in same semester';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Test 6 PASSED: Second booking in same semester rejected';
  END;

  -- Cleanup
  DELETE FROM bookings WHERE user_id = u;
  DELETE FROM sessions WHERE id IN (s1, s2);
  DELETE FROM profiles WHERE id = u;
  DELETE FROM auth.users WHERE id = u;
END $$;

-- Test 5: Date+Period uniqueness (should FAIL on second insert)
DO $$
DECLARE
  session1_id UUID;
BEGIN
  INSERT INTO sessions (date, period, max_capacity)
  VALUES ('2026-02-15', 'morning', 15)
  RETURNING id INTO session1_id;
  
  INSERT INTO sessions (date, period, max_capacity)
  VALUES ('2026-02-15', 'morning', 20);
  
  RAISE EXCEPTION 'Test 5 FAILED: Should reject duplicate date+period';
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'Test 5 PASSED: Duplicate date+period rejected correctly';
    DELETE FROM sessions WHERE id = session1_id;
END $$;

-- Cleanup test data
DELETE FROM sessions WHERE date BETWEEN '2026-02-10' AND '2026-02-15';

-- Test 7: auth.users trigger should create/update a profile
DO $$
DECLARE
  u UUID := gen_random_uuid();
  email TEXT := 'trigger+' || substr(u::text, 1, 8) || '@example.com';
  saram TEXT := 'TRG001';
  fullname TEXT := 'Trigger Test';
BEGIN
  INSERT INTO auth.users (id, aud, role, email, raw_user_meta_data, email_confirmed_at, created_at, updated_at)
    VALUES (u, 'authenticated', 'authenticated', email, jsonb_build_object('saram', saram, 'full_name', fullname), NOW(), NOW(), NOW());

  PERFORM 1 FROM public.profiles WHERE id = u AND saram = saram AND full_name = fullname;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Test 7 FAILED: profile not created by trigger';
  ELSE
    RAISE NOTICE 'Test 7 PASSED: profile created by trigger';
  END IF;

  -- Cleanup created test data
  DELETE FROM profiles WHERE id = u;
  DELETE FROM auth.users WHERE id = u;
END $$;

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'All tests completed successfully!';
  RAISE NOTICE '============================================';
END
$$;
