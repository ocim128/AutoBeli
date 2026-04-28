/**
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest";
import {
  collectUnsoldUsernames,
  convertBulkRawInput,
  convertRawLine,
  extractUsernameFromContent,
  matchUnsoldStockItemIdsByUsername,
  parseUsernameList,
} from "@/lib/stockConverter";

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
  it("extracts usernames from stored stock content", () => {
    expect(
      extractUsernameFromContent(`gpx52lo7@akunlama.com
username: nurjanahirma9
password:upsieiclp`)
    ).toBe("nurjanahirma9");

    expect(
      extractUsernameFromContent(`mail@example.com
password: charming@abc

Username•Post•Follower•Tahun = dashboardhero•12•431•2018`)
    ).toBe("dashboardhero");
  });

  it("collects usernames from unsold content only", () => {
    const usernames = collectUnsoldUsernames([
      {
        content: `first@example.com
username: ready_one
password:secret`,
        isSold: false,
      },
      {
        content: `second@example.com
username: sold_one
password:secret`,
        isSold: true,
      },
      {
        content: `third@example.com
password:secret

Username•Post•Follower•Tahun = ready_two•20•500•2020`,
        isSold: false,
      },
    ]);

    expect(usernames).toEqual(["ready_one", "ready_two"]);
  });

  it("parses pasted username lists and removes duplicates", () => {
    const usernames = parseUsernameList(`
ready_one
@READY_ONE

ready_two
    ready_three
`);

    expect(usernames).toEqual(["ready_one", "ready_two", "ready_three"]);
  });

  it("matches only unsold stock items by pasted username", () => {
    const result = matchUnsoldStockItemIdsByUsername(
      [
        {
          id: "stock-1",
          content: `first@example.com
username: ready_one
password:secret`,
          isSold: false,
        },
        {
          id: "stock-2",
          content: `second@example.com
username: sold_one
password:secret`,
          isSold: true,
        },
        {
          id: "stock-3",
          content: `third@example.com
password:secret

Usernameâ€¢Postâ€¢Followerâ€¢Tahun = ready_twoâ€¢20â€¢500â€¢2020`,
          isSold: false,
        },
      ],
      ["ready_one", "@sold_one", "missing_user", "READY_TWO"]
    );

    expect(result.stockItemIds).toEqual(["stock-1", "stock-3"]);
    expect(result.matchedUsernames).toEqual(["ready_one", "READY_TWO"]);
    expect(result.missingUsernames).toEqual(["@sold_one", "missing_user"]);
  });
});
