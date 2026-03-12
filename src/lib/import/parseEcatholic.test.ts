import { describe, expect, it } from "vitest";
import { parseEcatholicTable } from "@/lib/import/parseEcatholic";

describe("parseEcatholicTable", () => {
  it("parses rows into events", () => {
    const html = `
      <table id="gospelComparisonTable">
        <tr><th>Event</th><th>Location</th><th>Matthew</th><th>Mark</th><th>Luke</th><th>John</th></tr>
        <tr><td>Baptism of Jesus</td><td>Jordan River</td><td>3:13-17</td><td>1:9-11</td><td>3:21-22</td><td>1:29-34</td></tr>
        <tr><td>Wedding at Cana</td><td>Cana</td><td></td><td></td><td></td><td>2:1-12</td></tr>
      </table>
    `;

    const { events, report } = parseEcatholicTable(html);

    expect(events).toHaveLength(2);
    expect(events[0].title).toBe("Baptism of Jesus");
    expect(events[0].location).toBe("Jordan River");
    expect(events[0].references.mark).toBe("1:9-11");
    expect(report.unresolvedRows).toHaveLength(0);
  });
});

