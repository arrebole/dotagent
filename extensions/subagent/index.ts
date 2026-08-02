import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { discoverAgentDefinitions } from "./loader";


export default function websearchExtension(pi: ExtensionAPI) {
    const definitions = discoverAgentDefinitions()
    console.log(definitions);
}