import { NAMESPACE_PREFIXES } from './types';

/**
 * Namespace resolver for GPX XML documents.
 *
 * Handles dynamic namespace prefix resolution and provides methods
 * for namespace-aware element selection. This allows parsing GPX files
 * regardless of the namespace prefixes used by different GPS manufacturers.
 */
export class NamespaceResolver {
    private prefixToNamespace = new Map<string, string>();
    private namespaceToPrefix = new Map<string, string>();

    constructor(xmlDocument: Document) {
        this.extractNamespaces(xmlDocument.documentElement);
    }

    /**
     * Extract all namespace declarations from the XML document.
     * Builds bidirectional mapping between prefixes and namespace URIs.
     */
    private extractNamespaces(element: Element): void {
        // Extract xmlns attributes from the element
        const attributes = element.attributes;

        for (let i = 0; i < attributes.length; i++) {
            const attr = attributes[i];

            if (attr.name === 'xmlns') {
                // Default namespace: xmlns="http://..."
                this.registerNamespace('', attr.value);
            } else if (attr.name.startsWith('xmlns:')) {
                // Prefixed namespace: xmlns:prefix="http://..."
                const prefix = attr.name.substring(6); // Remove 'xmlns:' prefix
                this.registerNamespace(prefix, attr.value);
            }
        }

        // Also check parent elements for namespace declarations
        // (though typically they're all declared on the root element)
        if (element.parentElement) {
            this.extractNamespaces(element.parentElement);
        }
    }

    /**
     * Register a namespace prefix and URI mapping
     */
    private registerNamespace(prefix: string, namespaceUri: string): void {
        this.prefixToNamespace.set(prefix, namespaceUri);

        // For the reverse mapping, prefer known standard prefixes
        if (!this.namespaceToPrefix.has(namespaceUri)) {
            // Use standard prefix if available, otherwise use discovered prefix
            const standardPrefix =
                NAMESPACE_PREFIXES[namespaceUri as keyof typeof NAMESPACE_PREFIXES];
            this.namespaceToPrefix.set(namespaceUri, standardPrefix || prefix);
        }
    }

    /**
     * Get namespace URI for a given prefix
     */
    getNamespaceUri(prefix: string): string | null {
        return this.prefixToNamespace.get(prefix) || null;
    }

    /**
     * Get preferred prefix for a given namespace URI
     */
    getPrefix(namespaceUri: string): string | null {
        return this.namespaceToPrefix.get(namespaceUri) || null;
    }

    /**
     * Check if a namespace URI is registered in this document
     */
    hasNamespace(namespaceUri: string): boolean {
        return this.namespaceToPrefix.has(namespaceUri);
    }

    /**
     * Find elements with a specific local name in a specific namespace.
     * This works regardless of the prefix used in the document.
     *
     * @param parent Parent element to search within
     * @param localName Local name of the element (without prefix)
     * @param namespaceUri Target namespace URI
     * @returns First matching element or null
     */
    findElementByNamespace(
        parent: Element,
        localName: string,
        namespaceUri: string
    ): Element | null {
        // If namespace is not registered, return null
        if (!this.hasNamespace(namespaceUri)) {
            return null;
        }

        // Walk through child elements manually to find matches
        const children = parent.children;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (this.elementMatches(child, localName, namespaceUri)) {
                return child;
            }
        }

        return null;
    }

    /**
     * Find all elements with a specific local name in a specific namespace.
     *
     * @param parent Parent element to search within
     * @param localName Local name of the element (without prefix)
     * @param namespaceUri Target namespace URI
     * @returns Array of matching elements
     */
    findElementsByNamespace(parent: Element, localName: string, namespaceUri: string): Element[] {
        // If namespace is not registered, return empty array
        if (!this.hasNamespace(namespaceUri)) {
            return [];
        }

        const matches: Element[] = [];
        const children = parent.children;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (this.elementMatches(child, localName, namespaceUri)) {
                matches.push(child);
            }
        }

        return matches;
    }

    /**
     * Check if an element matches the given local name and namespace
     */
    private elementMatches(element: Element, localName: string, namespaceUri: string): boolean {
        const tagName = element.tagName;
        const colonIndex = tagName.indexOf(':');

        if (colonIndex === -1) {
            // No prefix - check if it matches the local name and the default namespace
            if (tagName.toLowerCase() === localName.toLowerCase()) {
                const elementNamespace = this.getElementNamespace(element);
                return elementNamespace === namespaceUri;
            }
            return false;
        } else {
            // Has prefix - check local name and namespace
            const elementLocalName = tagName.substring(colonIndex + 1);
            if (elementLocalName.toLowerCase() === localName.toLowerCase()) {
                const elementNamespace = this.getElementNamespace(element);
                return elementNamespace === namespaceUri;
            }
            return false;
        }
    }

    /**
     * Get the namespace URI for an element based on its prefix
     */
    getElementNamespace(element: Element): string | null {
        const tagName = element.tagName;
        const colonIndex = tagName.indexOf(':');

        if (colonIndex === -1) {
            // No prefix, use default namespace
            return this.getNamespaceUri('');
        } else {
            // Has prefix, look up namespace
            const prefix = tagName.substring(0, colonIndex);
            return this.getNamespaceUri(prefix);
        }
    }

    /**
     * Check if an element belongs to a specific namespace
     */
    isElementInNamespace(element: Element, namespaceUri: string): boolean {
        return this.getElementNamespace(element) === namespaceUri;
    }

    /**
     * Create a qualified element name for a given namespace and local name.
     * Uses the prefix discovered in this document.
     */
    createQualifiedName(localName: string, namespaceUri: string): string | null {
        if (!this.hasNamespace(namespaceUri)) {
            return null;
        }

        const prefix = this.getPrefix(namespaceUri);
        if (prefix === null) {
            return null;
        }

        return prefix ? `${prefix}:${localName}` : localName;
    }

    /**
     * Get all registered namespaces as a Map
     */
    getAllNamespaces(): Map<string, string> {
        return new Map(this.namespaceToPrefix);
    }

    /**
     * Debug method to log all discovered namespaces
     */
    logNamespaces(): void {
        console.log('Discovered namespaces:');
        for (const [uri, prefix] of this.namespaceToPrefix) {
            console.log(`  ${prefix || '(default)'}: ${uri}`);
        }
    }
}
