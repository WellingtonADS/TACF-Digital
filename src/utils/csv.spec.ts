import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { downloadCSV } from "./csv";

describe("downloadCSV", () => {
  let clickSpy: ReturnType<typeof vi.fn>;
  let anchor: HTMLAnchorElement;
  let capturedBlobs: Blob[];
  let capturedContents: string[];
  let OriginalBlob: typeof Blob;

  beforeEach(() => {
    capturedBlobs = [];
    capturedContents = [];
    OriginalBlob = global.Blob;

    // Intercept Blob constructor to capture created blobs
    global.Blob = class extends OriginalBlob {
      constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
        super(parts, options);
        capturedBlobs.push(this);
        const text = (parts ?? [])
          .map((part) => {
            if (typeof part === "string") return part;
            if (part instanceof ArrayBuffer) {
              return new TextDecoder().decode(part);
            }
            if (ArrayBuffer.isView(part)) {
              return new TextDecoder().decode(part);
            }
            return String(part);
          })
          .join("");
        capturedContents.push(text);
      }
    } as unknown as typeof Blob;

    global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();

    clickSpy = vi.fn();
    anchor = {
      href: "",
      download: "",
      click: clickSpy,
    } as unknown as HTMLAnchorElement;
    vi.spyOn(document, "createElement").mockReturnValue(anchor);
  });

  afterEach(() => {
    global.Blob = OriginalBlob;
    vi.restoreAllMocks();
  });

  it("define download com o filename correto", () => {
    downloadCSV("relatorio.csv", [["val"]], ["Header"]);
    expect(anchor.download).toBe("relatorio.csv");
  });

  it("define href com a url gerada pelo createObjectURL", () => {
    downloadCSV("relatorio.csv", [["val"]], ["Header"]);
    expect(anchor.href).toBe("blob:mock-url");
  });

  it("chama click() no link criado", () => {
    downloadCSV("relatorio.csv", [], ["H1"]);
    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it("revoga a URL após o click", () => {
    downloadCSV("relatorio.csv", [], ["H1"]);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("cria exatamente um Blob", () => {
    downloadCSV("relatorio.csv", [], ["H1"]);
    expect(capturedBlobs).toHaveLength(1);
  });

  it("cria Blob com type text/csv;charset=utf-8;", () => {
    downloadCSV("relatorio.csv", [], ["H1"]);
    expect(capturedBlobs[0].type).toBe("text/csv;charset=utf-8;");
  });

  it("o conteúdo do Blob começa com BOM UTF-8", async () => {
    downloadCSV("bom.csv", [], ["Col"]);
    const text = capturedContents[0];
    expect(text.charCodeAt(0)).toBe(0xfeff);
  });

  it("inclui o header no conteúdo", async () => {
    downloadCSV("h.csv", [], ["NomeColuna"]);
    const text = capturedContents[0];
    expect(text).toContain('"NomeColuna"');
  });

  it("inclui as rows no conteúdo", async () => {
    downloadCSV("r.csv", [["Alpha", "Beta"]], ["A", "B"]);
    const text = capturedContents[0];
    expect(text).toContain('"Alpha"');
    expect(text).toContain('"Beta"');
  });

  it("linhas são separadas por \\r\\n", async () => {
    downloadCSV("crlf.csv", [["v1"]], ["H1"]);
    const text = capturedContents[0];
    expect(text).toContain("\r\n");
  });

  it("escapa null como string vazia", async () => {
    downloadCSV("null.csv", [[null]], ["H"]);
    const text = capturedContents[0];
    expect(text).toContain('""');
  });

  it("escapa undefined como string vazia", async () => {
    downloadCSV("undef.csv", [[undefined]], ["H"]);
    const text = capturedContents[0];
    // After header row and \r\n, second line should be empty string
    const lines = text.split("\r\n");
    expect(lines[1]).toBe('""');
  });

  it("converte número para string", async () => {
    downloadCSV("num.csv", [[42]], ["Num"]);
    const text = capturedContents[0];
    expect(text).toContain('"42"');
  });

  it("converte boolean para string", async () => {
    downloadCSV("bool.csv", [[true]], ["Bool"]);
    const text = capturedContents[0];
    expect(text).toContain('"true"');
  });

  it("serializa objeto como JSON", async () => {
    downloadCSV("obj.csv", [[{ key: "val" }]], ["Obj"]);
    const text = capturedContents[0];
    expect(text).toContain('"{""key"":""val""}"');
  });

  it("escapa aspas duplas dentro do valor", async () => {
    downloadCSV("quot.csv", [['diz "olá"']], ["H"]);
    const text = capturedContents[0];
    expect(text).toContain('"diz ""olá"""');
  });

  it("suporta múltiplas colunas no header", async () => {
    downloadCSV("multi.csv", [], ["A", "B", "C"]);
    const text = capturedContents[0];
    const firstLine = text.replace("\uFEFF", "").split("\r\n")[0];
    expect(firstLine).toBe('"A","B","C"');
  });

  it("suporta múltiplas rows", async () => {
    downloadCSV("rows.csv", [["r1"], ["r2"], ["r3"]], ["H"]);
    const text = capturedContents[0];
    const lines = text.split("\r\n");
    // BOM line is header, then 3 rows
    expect(lines).toHaveLength(4);
  });
});
