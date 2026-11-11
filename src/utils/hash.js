/** Short hash of a string, e.g. a tile URL, for use in IDs. */
export function hashCode(text) {
    let hash = 0
    for (let i = 0; i < text.length; i++) {
        hash = (Math.imul(31, hash) + text.charCodeAt(i)) | 0
    }
    return (hash >>> 0).toString(36)
}
