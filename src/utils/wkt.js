/**
 * Convert a GeoJSON geometry object to a WKT string.
 */
export function geojsonToWkt(geometry) {
    if (!geometry) return ""
    const c = ([x, y]) => `${x} ${y}`
    const ring = (coords) => `(${coords.map(c).join(", ")})`
    switch (geometry.type) {
        case "Point":
            return `POINT (${c(geometry.coordinates)})`
        case "LineString":
            return `LINESTRING ${ring(geometry.coordinates)}`
        case "Polygon":
            return `POLYGON (${geometry.coordinates.map(ring).join(", ")})`
        case "MultiPolygon":
            return `MULTIPOLYGON (${geometry.coordinates
                .map((poly) => `(${poly.map(ring).join(", ")})`)
                .join(", ")})`
        default:
            return ""
    }
}

/**
 * Parse a WKT string into a GeoJSON geometry object.
 * Supports POINT, LINESTRING, POLYGON, MULTIPOLYGON.
 * Returns null on parse failure.
 */
export function wktToGeojson(wkt) {
    if (!wkt || !wkt.trim()) return null
    try {
        const tokens = tokenize(wkt)
        const [geom] = parseGeometry(tokens, 0)
        return geom
    } catch {
        return null
    }
}

function tokenize(wkt) {
    return wkt.match(/[A-Za-z]+|[-\d.]+|[(),]/g) ?? []
}

function parseGeometry(tokens, i) {
    const type = tokens[i]?.toUpperCase()
    i++
    if (tokens[i]?.toUpperCase() === "EMPTY") return [null, i + 1]
    if (["Z", "M", "ZM"].includes(tokens[i]?.toUpperCase())) i++

    switch (type) {
        case "POINT": {
            expect(tokens[i++], "(")
            const [coord, j] = parseCoord(tokens, i)
            expect(tokens[j], ")")
            return [{ type: "Point", coordinates: coord }, j + 1]
        }
        case "LINESTRING": {
            const [coords, j] = parseCoordList(tokens, i)
            return [{ type: "LineString", coordinates: coords }, j]
        }
        case "POLYGON": {
            const [rings, j] = parseRingList(tokens, i)
            return [{ type: "Polygon", coordinates: rings }, j]
        }
        case "MULTIPOLYGON": {
            expect(tokens[i++], "(")
            const polys = []
            while (tokens[i] !== ")") {
                const [rings, j] = parseRingList(tokens, i)
                polys.push(rings)
                i = j
                if (tokens[i] === ",") i++
            }
            return [{ type: "MultiPolygon", coordinates: polys }, i + 1]
        }
        default:
            throw new Error(`Unknown geometry type: ${type}`)
    }
}

function parseCoord(tokens, i) {
    const x = parseFloat(tokens[i++])
    const y = parseFloat(tokens[i++])
    // skip optional Z value
    if (tokens[i] !== ")" && tokens[i] !== "," && /^[-\d.]/.test(tokens[i] ?? ""))
        i++
    return [[x, y], i]
}

function parseCoordList(tokens, i) {
    expect(tokens[i++], "(")
    const coords = []
    while (tokens[i] !== ")") {
        const [coord, j] = parseCoord(tokens, i)
        coords.push(coord)
        i = j
        if (tokens[i] === ",") i++
    }
    return [coords, i + 1]
}

function parseRingList(tokens, i) {
    expect(tokens[i++], "(")
    const rings = []
    while (tokens[i] !== ")") {
        const [coords, j] = parseCoordList(tokens, i)
        rings.push(coords)
        i = j
        if (tokens[i] === ",") i++
    }
    return [rings, i + 1]
}

function expect(token, expected) {
    if (token !== expected) throw new Error(`Expected '${expected}', got '${token}'`)
}

/**
 * Return the [lng, lat] centroid of a GeoJSON geometry.
 * Polygons use the signed-area formula; MultiPolygon is area-weighted.
 * Returns null for unsupported or degenerate input.
 */
export function geojsonCentroid(geometry) {
    if (!geometry) return null
    switch (geometry.type) {
        case "Point":
            return [geometry.coordinates[0], geometry.coordinates[1]]
        case "LineString": {
            const c = geometry.coordinates
            return [
                c.reduce((s, p) => s + p[0], 0) / c.length,
                c.reduce((s, p) => s + p[1], 0) / c.length,
            ]
        }
        case "Polygon":
            return ringCentroid(geometry.coordinates[0])
        case "MultiPolygon": {
            let totalArea = 0, cx = 0, cy = 0
            for (const poly of geometry.coordinates) {
                const [c, area] = ringCentroidAndArea(poly[0])
                if (area > 0) { totalArea += area; cx += c[0] * area; cy += c[1] * area }
            }
            return totalArea > 0 ? [cx / totalArea, cy / totalArea] : null
        }
        default:
            return null
    }
}

function ringCentroid(ring) {
    return ringCentroidAndArea(ring)[0]
}

function ringCentroidAndArea(ring) {
    let area = 0, cx = 0, cy = 0
    const n = ring.length
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const cross = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1]
        area += cross
        cx += (ring[j][0] + ring[i][0]) * cross
        cy += (ring[j][1] + ring[i][1]) * cross
    }
    area /= 2
    const absArea = Math.abs(area)
    if (absArea < 1e-12) {
        // Degenerate — fall back to vertex average
        return [
            [
                ring.reduce((s, p) => s + p[0], 0) / ring.length,
                ring.reduce((s, p) => s + p[1], 0) / ring.length,
            ],
            absArea,
        ]
    }
    return [[cx / (6 * area), cy / (6 * area)], absArea]
}
