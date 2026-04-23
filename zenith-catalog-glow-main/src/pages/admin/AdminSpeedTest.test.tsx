import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminSpeedTest from "@/pages/admin/AdminSpeedTest";

vi.mock("@/components/admin/AdminLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("AdminSpeedTest", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: {
        effectiveType: "4g",
        downlink: 12,
        rtt: 50,
        saveData: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("runs the latency and download checks and reports the result", async () => {
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("downloadTest")) {
        return {
          ok: true,
          blob: async () => new Blob(["speed-check".repeat(5000)]),
        } as Response;
      }

      return {
        ok: true,
        text: async () => "pong",
      } as Response;
    }) as typeof fetch;

    render(
      <MemoryRouter>
        <AdminSpeedTest />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /start speed test/i }));

    expect(await screen.findByText("Test completed")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Connection looks healthy for normal admin usage\.|Connection is usable, but large media uploads may feel slow\.|Connection is on the slower side\. Expect delays on media-heavy actions\./
      )
    ).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(4);
  });

  it("shows an error surface when the download probe fails", async () => {
    global.fetch = vi.fn(async () => ({ ok: false }) as Response) as typeof fetch;

    render(
      <MemoryRouter>
        <AdminSpeedTest />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /start speed test/i }));

    await waitFor(() =>
      expect(screen.getByText("Unable to reach the storefront for latency testing.")).toBeInTheDocument()
    );
    expect(screen.getByText("Test failed")).toBeInTheDocument();
  });
});
