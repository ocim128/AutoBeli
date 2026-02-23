/**
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest";
import { convertBulkRawInput, convertRawLine } from "@/lib/stockConverter";

describe("stockConverter", () => {
  it("parses akunlama credential format with 2FA secret", () => {
    const input =
      "gpx52lo7@akunlama.com♦nurjanahirma9•upsieiclp#71412748854:eyJkc191c2VyX2lkIjoiNzE0MTI3NDg4NTQiLCJzZXNzaW9uaWQiOiI3MTQxMjc0ODg1NCUzQTBwaEZRT21MYjlkR0ROJTNBMyUzQUFZZVRkUm1QUnEwWmt5bnY1al9DNHBhSHFRSlBnMnpKWWdzYmU3Q0VWQSJ9&OKRZBPCRJXCVISDLEXZE65MUB3ORYP6K";

    const result = convertRawLine(input);
    expect(result).not.toBeNull();

    if (!result) return;

    expect(result.email).toBe("gpx52lo7@akunlama.com");
    expect(result.username).toBe("nurjanahirma9");
    expect(result.password).toBe("upsieiclp");
    expect(result.sessionid).toContain("71412748854:");
    expect(result.twoFALink).toBe("2fa.akunlama.com/?secret=OKRZBPCRJXCVISDLEXZE65MUB3ORYP6K");
    expect(result.rawContent).toBe(`gpx52lo7@akunlama.com
username: nurjanahirma9
password:upsieiclp
Link Autentikasi: 2fa.akunlama.com/?secret=OKRZBPCRJXCVISDLEXZE65MUB3ORYP6K`);
  });

  it("parses multiple lines of akunlama credential format in bulk", () => {
    const input = `gpx52lo7@akunlama.com♦nurjanahirma9•upsieiclp#71412748854:tokenA&OKRZBPCRJXCVISDLEXZE65MUB3ORYP6K
sa2i171h@akunlama.com♦audinajunaidah•4s0otxn1w#71198749224:tokenB&VIBGS76W3HMFF6CXFNRVX3R5ST5DY4MT`;

    const result = convertBulkRawInput(input);

    expect(result.errors).toHaveLength(0);
    expect(result.converted).toHaveLength(2);
    expect(result.converted[0].email).toBe("gpx52lo7@akunlama.com");
    expect(result.converted[1].email).toBe("sa2i171h@akunlama.com");
    expect(result.converted[1].username).toBe("audinajunaidah");
    expect(result.converted[1].password).toBe("4s0otxn1w");
    expect(result.converted[1].twoFALink).toBe(
      "2fa.akunlama.com/?secret=VIBGS76W3HMFF6CXFNRVX3R5ST5DY4MT"
    );
  });
});
