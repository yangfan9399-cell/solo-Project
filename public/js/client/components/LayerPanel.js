import React from 'react';
export function LayerPanel({ details, result, onToggleLayer }) {
    const layerMap = new Map(result.layers.map(l => [l.layerId, l]));
    return (React.createElement("div", { className: "layer-panel" },
        React.createElement("div", { className: "panel-section" },
            React.createElement("h3", { className: "panel-title" }, "\u7B49\u9AD8\u7EBF\u56FE\u5C42"),
            React.createElement("p", { className: "panel-desc" },
                "\u5171 ",
                details.length,
                " \u6761\u7B49\u9AD8\u7EBF\uFF0C\u53EF\u5206\u5C42\u663E\u793A/\u9690\u85CF")),
        React.createElement("div", { className: "layer-list" }, details.map(detail => {
            const layer = layerMap.get(detail.id);
            const visible = layer ? layer.visible : true;
            const color = layer?.color || detail.color;
            return (React.createElement("div", { key: detail.id, className: `layer-item ${visible ? '' : 'hidden'}`, onClick: () => onToggleLayer?.(detail.id) },
                React.createElement("div", { className: "layer-color", style: { backgroundColor: color } }),
                React.createElement("div", { className: "layer-info" },
                    React.createElement("div", { className: "layer-name" },
                        "\u7B2C ",
                        detail.contourIndex,
                        " \u5C42"),
                    React.createElement("div", { className: "layer-elev" },
                        "\u9AD8\u7A0B ",
                        detail.elevation,
                        "m")),
                React.createElement("div", { className: "layer-toggle" },
                    React.createElement("input", { type: "checkbox", checked: visible, onChange: (e) => {
                            e.stopPropagation();
                            onToggleLayer?.(detail.id);
                        } }))));
        })),
        React.createElement("div", { className: "panel-section" },
            React.createElement("h4", { className: "panel-subtitle" }, "\u56FE\u4F8B\u8BF4\u660E"),
            React.createElement("div", { className: "legend-list" },
                React.createElement("div", { className: "legend-item" },
                    React.createElement("div", { className: "legend-line contour-line" }),
                    React.createElement("span", null, "\u7B49\u9AD8\u7EBF")),
                React.createElement("div", { className: "legend-item" },
                    React.createElement("div", { className: "legend-line ridge-line" }),
                    React.createElement("span", null, "\u5C71\u810A\u7EBF")),
                React.createElement("div", { className: "legend-item" },
                    React.createElement("div", { className: "legend-line profile-line" }),
                    React.createElement("span", null, "\u5256\u9762\u7EBF")),
                React.createElement("div", { className: "legend-item" },
                    React.createElement("div", { className: "legend-line aspect-line" }),
                    React.createElement("span", null, "\u5761\u5411\u7BAD\u5934")))),
        React.createElement("div", { className: "panel-section" },
            React.createElement("h4", { className: "panel-subtitle" }, "\u56FE\u5C42\u7EDF\u8BA1"),
            React.createElement("div", { className: "stat-grid" },
                React.createElement("div", { className: "stat-item" },
                    React.createElement("div", { className: "stat-value" }, details.length),
                    React.createElement("div", { className: "stat-label" }, "\u603B\u5C42\u6570")),
                React.createElement("div", { className: "stat-item" },
                    React.createElement("div", { className: "stat-value" }, result.layers.filter(l => l.visible).length),
                    React.createElement("div", { className: "stat-label" }, "\u663E\u793A\u4E2D")),
                React.createElement("div", { className: "stat-item" },
                    React.createElement("div", { className: "stat-value" },
                        details.length > 0 ? (Math.max(...details.map(d => d.elevation)) - Math.min(...details.map(d => d.elevation))) : 0,
                        "m"),
                    React.createElement("div", { className: "stat-label" }, "\u9AD8\u5DEE"))))));
}
