import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightTypeDoc, {
    typeDocSidebarGroup,
    createStarlightTypeDocPlugin,
} from "starlight-typedoc";
import starlightThemeNova from "starlight-theme-nova";

const [rpcTypeDoc, rpcSidebarGroup] = createStarlightTypeDocPlugin();
const [delayedTypeDoc, delayedSidebarGroup] = createStarlightTypeDocPlugin();
const [subscriptionsTypeDoc, subscriptionsSidebarGroup] = createStarlightTypeDocPlugin();
const [loggerTypeDoc, loggerSidebarGroup] = createStarlightTypeDocPlugin();
const [contractsTypeDoc, contractsSidebarGroup] = createStarlightTypeDocPlugin();
const [operationsTypeDoc, operationsSidebarGroup] = createStarlightTypeDocPlugin();

export default defineConfig({
    site: "https://apogee-travel.github.io",
    base: "/hoppity",
    vite: {
        ssr: {
            noExternal: ["nanoid", "zod"],
        },
    },
    integrations: [
        starlight({
            title: "hoppity",
            logo: {
                light: "./src/assets/logo-light.svg",
                dark: "./src/assets/logo-dark.svg",
                replacesTitle: true,
            },
            description:
                "Pattern-driven RabbitMQ topology builder for Node.js microservices, built on Rascal.",
            favicon: "/hoppity/favicon.svg",
            head: [
                {
                    tag: "link",
                    attrs: {
                        rel: "icon",
                        href: "/hoppity/favicon.ico",
                        sizes: "32x32",
                    },
                },
                {
                    tag: "link",
                    attrs: {
                        rel: "icon",
                        href: "/hoppity/favicon-16x16.png",
                        sizes: "16x16",
                        type: "image/png",
                    },
                },
                {
                    tag: "link",
                    attrs: {
                        rel: "apple-touch-icon",
                        href: "/hoppity/apple-touch-icon.png",
                    },
                },
                {
                    tag: "link",
                    attrs: {
                        rel: "manifest",
                        href: "/hoppity/site.webmanifest",
                    },
                },
                {
                    tag: "meta",
                    attrs: {
                        property: "og:image",
                        content: "/hoppity/og-image.png",
                    },
                },
            ],
            customCss: ["./src/styles/custom.css"],
            plugins: [
                starlightThemeNova(),
                starlightTypeDoc({
                    entryPoints: ["../hoppity/src/index.ts"],
                    tsconfig: "../hoppity/tsconfig.json",
                    sidebar: { label: "Core API" },
                }),
                rpcTypeDoc({
                    entryPoints: ["../hoppity-rpc/src/index.ts"],
                    tsconfig: "../hoppity-rpc/tsconfig.json",
                    output: "api-rpc",
                    sidebar: { label: "API Reference", collapsed: true },
                }),
                delayedTypeDoc({
                    entryPoints: ["../hoppity-delayed-publish/src/index.ts"],
                    tsconfig: "../hoppity-delayed-publish/tsconfig.json",
                    output: "api-delayed-publish",
                    sidebar: { label: "API Reference", collapsed: true },
                }),
                subscriptionsTypeDoc({
                    entryPoints: ["../hoppity-subscriptions/src/index.ts"],
                    tsconfig: "../hoppity-subscriptions/tsconfig.json",
                    output: "api-subscriptions",
                    sidebar: { label: "API Reference", collapsed: true },
                }),
                loggerTypeDoc({
                    entryPoints: ["../hoppity-logger/src/index.ts"],
                    tsconfig: "../hoppity-logger/tsconfig.json",
                    output: "api-logger",
                    sidebar: { label: "API Reference", collapsed: true },
                }),
                contractsTypeDoc({
                    entryPoints: ["../hoppity-contracts/src/index.ts"],
                    tsconfig: "../hoppity-contracts/tsconfig.json",
                    output: "api-contracts",
                    sidebar: { label: "API Reference", collapsed: true },
                }),
                operationsTypeDoc({
                    entryPoints: ["../hoppity-operations/src/index.ts"],
                    tsconfig: "../hoppity-operations/tsconfig.json",
                    output: "api-operations",
                    sidebar: { label: "API Reference", collapsed: true },
                }),
            ],
            social: [
                {
                    icon: "github",
                    label: "GitHub",
                    href: "https://github.com/apogee-stealth/hoppity",
                },
                {
                    icon: "npm",
                    label: "npm",
                    href: "https://www.npmjs.com/package/@apogeelabs/hoppity",
                },
            ],
            sidebar: [
                {
                    label: "Guide",
                    items: [
                        { slug: "guide/introduction" },
                        { slug: "guide/getting-started" },
                        { slug: "guide/concepts" },
                    ],
                },
                typeDocSidebarGroup,
                {
                    label: "hoppity-rpc",
                    collapsed: true,
                    items: [{ slug: "packages/hoppity-rpc" }, rpcSidebarGroup],
                },
                {
                    label: "hoppity-delayed-publish",
                    collapsed: true,
                    items: [{ slug: "packages/hoppity-delayed-publish" }, delayedSidebarGroup],
                },
                {
                    label: "hoppity-subscriptions",
                    collapsed: true,
                    items: [{ slug: "packages/hoppity-subscriptions" }, subscriptionsSidebarGroup],
                },
                {
                    label: "hoppity-logger",
                    collapsed: true,
                    items: [{ slug: "packages/hoppity-logger" }, loggerSidebarGroup],
                },
                {
                    label: "hoppity-contracts",
                    collapsed: true,
                    items: [{ slug: "packages/hoppity-contracts" }, contractsSidebarGroup],
                },
                {
                    label: "hoppity-operations",
                    collapsed: true,
                    items: [{ slug: "packages/hoppity-operations" }, operationsSidebarGroup],
                },
                {
                    label: "Examples",
                    items: [
                        { slug: "examples/overview" },
                        { slug: "examples/basic-pubsub" },
                        { slug: "examples/delayed-publish" },
                        { slug: "examples/rpc" },
                        { slug: "examples/bookstore" },
                    ],
                },
            ],
        }),
    ],
});
