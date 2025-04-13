import Home from "./home";
import { Layout } from "~/root";
import { createRoutesStub } from "react-router";
import { render } from "vitest-browser-react";
import { page } from "@vitest/browser/context";
import { describe, test, expect, beforeEach } from "vitest";
import "../app.css";

describe("Home", () => {
    beforeEach(() => {
        const Stub = createRoutesStub([
            {
                path: "/",
                Component: () => (
                    <Layout>
                        <Home />
                    </Layout>
                ),
            },
        ]);
        render(<Stub initialEntries={["/"]} />);
    });

    test("renders", async () => {
        await expect
            .element(page.getByText("Free, disposable email addresses"))
            .toBeInTheDocument();
    });

    test("generates a random email", async () => {
        const emailInput = page.getByText("@");
        await expect.element(emailInput).toBeInTheDocument();

        await expect
            .element(page.getByText("Waiting for emails"))
            .toBeInTheDocument();
    });
});
