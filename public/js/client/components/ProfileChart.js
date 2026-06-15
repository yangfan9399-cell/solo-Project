import React, { useMemo } from 'react';
export function ProfileChart({ result, profileData }) {
    const data = profileData?.elevationData || [];
    const chartWidth = 260;
    const chartHeight = 120;
    const padding = { top: 10, right: 10, bottom: 25, left: 35 };
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;
    const chartData = useMemo(() => {
        if (data.length > 0)
            return data;
        return [
            { distance: 0, elevation: 120 },
            { distance: 50, elevation: 145 },
            { distance: 100, elevation: 180 },
            { distance: 150, elevation: 165 },
            { distance: 200, elevation: 210 },
            { distance: 250, elevation: 195 },
            { distance: 300, elevation: 175 },
        ];
    }, [data]);
    const maxElev = Math.max(...chartData.map(d => d.elevation));
    const minElev = Math.min(...chartData.map(d => d.elevation));
    const maxDist = Math.max(...chartData.map(d => d.distance));
    const totalDist = chartData.length > 1 ? chartData[chartData.length - 1].distance : 0;
    const elevRange = maxElev - minElev || 1;
    function xPos(distance) {
        return padding.left + (distance / maxDist) * innerWidth;
    }
    function yPos(elevation) {
        return padding.top + innerHeight - ((elevation - minElev) / elevRange) * innerHeight;
    }
    const pathD = chartData.map((d, i) => {
        const x = xPos(d.distance);
        const y = yPos(d.elevation);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    const areaD = `${pathD} L ${xPos(maxDist)} ${padding.top + innerHeight} L ${padding.left} ${padding.top + innerHeight} Z`;
    return (React.createElement("div", { className: "profile-chart" },
        React.createElement("svg", { width: chartWidth, height: chartHeight, className: "chart-svg" },
            React.createElement("defs", null,
                React.createElement("linearGradient", { id: "profileGrad", x1: "0%", y1: "0%", x2: "0%", y2: "100%" },
                    React.createElement("stop", { offset: "0%", stopColor: "#4ecdc4", stopOpacity: "0.5" }),
                    React.createElement("stop", { offset: "100%", stopColor: "#4ecdc4", stopOpacity: "0.05" }))),
            [0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (React.createElement("line", { key: i, x1: padding.left, y1: padding.top + innerHeight * ratio, x2: chartWidth - padding.right, y2: padding.top + innerHeight * ratio, stroke: "#3a4a5a", strokeWidth: "0.5" }))),
            React.createElement("path", { d: areaD, fill: "url(#profileGrad)" }),
            React.createElement("path", { d: pathD, fill: "none", stroke: "#4ecdc4", strokeWidth: "2" }),
            React.createElement("text", { x: padding.left - 5, y: yPos(maxElev) + 4, fontSize: "10", fill: "#8a9aae", textAnchor: "end" },
                maxElev,
                "m"),
            React.createElement("text", { x: padding.left - 5, y: yPos(minElev) + 4, fontSize: "10", fill: "#8a9aae", textAnchor: "end" },
                minElev,
                "m"),
            React.createElement("text", { x: chartWidth - padding.right, y: chartHeight - 5, fontSize: "10", fill: "#8a9aae", textAnchor: "end" },
                totalDist.toFixed(0),
                "m")),
        React.createElement("div", { className: "chart-stats" },
            React.createElement("div", { className: "chart-stat" },
                React.createElement("span", { className: "stat-label" }, "\u6700\u9AD8"),
                React.createElement("span", { className: "stat-value" },
                    maxElev,
                    "m")),
            React.createElement("div", { className: "chart-stat" },
                React.createElement("span", { className: "stat-label" }, "\u6700\u4F4E"),
                React.createElement("span", { className: "stat-value" },
                    minElev,
                    "m")),
            React.createElement("div", { className: "chart-stat" },
                React.createElement("span", { className: "stat-label" }, "\u603B\u8DDD"),
                React.createElement("span", { className: "stat-value" },
                    totalDist.toFixed(0),
                    "m")))));
}
