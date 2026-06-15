import React, { useMemo } from 'react';
export function MapCanvas({ master, details, histories, result }) {
    const visibleLayers = useMemo(() => {
        const layerMap = new Map(result.layers.map(l => [l.layerId, l]));
        return details.filter(d => {
            const layer = layerMap.get(d.id);
            return layer ? layer.visible : true;
        });
    }, [details, result.layers]);
    const ridges = histories.filter(h => h.type === 'ridge');
    const profiles = histories.filter(h => h.type === 'profile');
    const aspects = histories.filter(h => h.type === 'aspect');
    function pointsToPath(points, smooth = true) {
        if (points.length === 0)
            return '';
        if (!smooth || points.length < 3) {
            return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        }
        let path = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length - 1; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            path += ` Q ${points[i].x} ${points[i].y} ${xc} ${yc}`;
        }
        path += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
        return path;
    }
    const profile = profiles.length > 0 ? profiles[0].data : null;
    function renderProfileLine() {
        if (!profile)
            return null;
        return (React.createElement("line", { x1: profile.startPoint.x, y1: profile.startPoint.y, x2: profile.endPoint.x, y2: profile.endPoint.y, stroke: "#ff6b6b", strokeWidth: "2", strokeDasharray: "8,4" }));
    }
    return (React.createElement("div", { className: "map-canvas-container" },
        React.createElement("div", { className: "canvas-header" },
            React.createElement("span", { className: "canvas-title" }, master.name),
            React.createElement("span", { className: "canvas-batch" }, master.batch)),
        React.createElement("div", { className: "canvas-wrapper" },
            React.createElement("svg", { className: "map-svg", viewBox: `0 0 ${master.mapWidth} ${master.mapHeight}`, preserveAspectRatio: "xMidYMid meet" },
                React.createElement("defs", null,
                    React.createElement("filter", { id: "paper", x: "-20%", y: "-20%", width: "140%", height: "140%" },
                        React.createElement("feTurbulence", { type: "fractalNoise", baseFrequency: "0.04", numOctaves: "5", result: "noise" }),
                        React.createElement("feDisplacementMap", { in: "SourceGraphic", in2: "noise", scale: "3" })),
                    React.createElement("radialGradient", { id: "terrainGrad", cx: "50%", cy: "50%", r: "50%" },
                        React.createElement("stop", { offset: "0%", stopColor: "#2a3a4a" }),
                        React.createElement("stop", { offset: "100%", stopColor: "#1a2a3a" }))),
                React.createElement("rect", { x: "0", y: "0", width: master.mapWidth, height: master.mapHeight, fill: "url(#terrainGrad)", rx: "4" }),
                React.createElement("g", { dangerouslySetInnerHTML: { __html: master.mapImage } }),
                React.createElement("g", { className: "contour-layer" }, visibleLayers.map(detail => {
                    const layerEdit = result.layers.find(l => l.layerId === detail.id);
                    const color = layerEdit?.color || detail.color;
                    const opacity = layerEdit?.opacity ?? 1;
                    return (React.createElement("path", { key: detail.id, d: pointsToPath(detail.points, detail.isSmooth), fill: "none", stroke: color, strokeWidth: "1.5", opacity: opacity, vectorEffect: "non-scaling-stroke" }));
                })),
                React.createElement("g", { className: "ridge-layer" }, ridges.map(r => {
                    const ridge = r.data;
                    return (React.createElement("g", { key: r.id },
                        React.createElement("path", { d: pointsToPath(ridge.points, false), fill: "none", stroke: "#ffd93d", strokeWidth: "2.5", strokeLinecap: "round", vectorEffect: "non-scaling-stroke" }),
                        React.createElement("text", { x: ridge.points[Math.floor(ridge.points.length / 2)].x, y: ridge.points[Math.floor(ridge.points.length / 2)].y - 8, fill: "#ffd93d", fontSize: "12", textAnchor: "middle" }, ridge.name)));
                })),
                React.createElement("g", { className: "profile-layer" },
                    renderProfileLine(),
                    profile && (React.createElement(React.Fragment, null,
                        React.createElement("circle", { cx: profile.startPoint.x, cy: profile.startPoint.y, r: "5", fill: "#ff6b6b" }),
                        React.createElement("circle", { cx: profile.endPoint.x, cy: profile.endPoint.y, r: "5", fill: "#ff6b6b" }),
                        React.createElement("text", { x: profile.startPoint.x, y: profile.startPoint.y - 10, fill: "#ff6b6b", fontSize: "11", textAnchor: "middle" }, "\u8D77\u70B9"),
                        React.createElement("text", { x: profile.endPoint.x, y: profile.endPoint.y - 10, fill: "#ff6b6b", fontSize: "11", textAnchor: "middle" }, "\u7EC8\u70B9")))),
                React.createElement("g", { className: "aspect-layer" }, aspects.map(a => {
                    const aspect = a.data;
                    const arrowLen = 20;
                    const angle = (aspect.direction - 90) * Math.PI / 180;
                    const x2 = aspect.position.x + Math.cos(angle) * arrowLen;
                    const y2 = aspect.position.y + Math.sin(angle) * arrowLen;
                    return (React.createElement("g", { key: a.id },
                        React.createElement("line", { x1: aspect.position.x, y1: aspect.position.y, x2: x2, y2: y2, stroke: "#6bcfff", strokeWidth: "2", markerEnd: "url(#arrowhead)" }),
                        React.createElement("circle", { cx: aspect.position.x, cy: aspect.position.y, r: "3", fill: "#6bcfff" })));
                })),
                React.createElement("defs", null,
                    React.createElement("marker", { id: "arrowhead", markerWidth: "10", markerHeight: "7", refX: "9", refY: "3.5", orient: "auto" },
                        React.createElement("polygon", { points: "0 0, 10 3.5, 0 7", fill: "#6bcfff" }))),
                React.createElement("g", { className: "labels-layer" }, result.pointLabels.map(label => (React.createElement("g", { key: label.id },
                    React.createElement("circle", { cx: label.x, cy: label.y, r: "6", fill: "white", stroke: "#333", strokeWidth: "1.5" }),
                    React.createElement("text", { x: label.x, y: label.y + 4, fontSize: "9", fontWeight: "bold", textAnchor: "middle", fill: "#333" }, label.type === 'elevation' ? label.elevation : label.text.charAt(0)),
                    React.createElement("text", { x: label.x + 10, y: label.y + 4, fontSize: "11", fill: "white" }, label.text))))),
                React.createElement("g", { className: "error-notes-layer" }, result.errorNotes.filter(n => !n.resolved).map(note => (React.createElement("g", { key: note.id },
                    React.createElement("circle", { cx: note.x, cy: note.y, r: "8", fill: note.severity === 'high' ? '#ff4757' : note.severity === 'medium' ? '#ffa502' : '#70a1ff', opacity: "0.8" }),
                    React.createElement("text", { x: note.x, y: note.y + 4, fontSize: "10", fontWeight: "bold", textAnchor: "middle", fill: "white" }, "!")))))),
            React.createElement("div", { className: "scale-bar" },
                React.createElement("div", { className: "scale-bar-line" }),
                React.createElement("span", { className: "scale-bar-text" },
                    master.scale,
                    " ",
                    master.scaleUnit)),
            React.createElement("div", { className: "map-info" },
                React.createElement("span", null,
                    "\u6BD4\u4F8B\u5C3A 1:",
                    master.scale),
                React.createElement("span", null,
                    master.mapWidth,
                    "\u00D7",
                    master.mapHeight,
                    "px")))));
}
