const BoardUI = {
    svg: null,
    onNodeClick: null,

    init(onNodeClick) {
        this.svg = document.getElementById('gameBoard');
        this.onNodeClick = onNodeClick;
    },

    render(level, gameState) {
        if (!this.svg || !level) return;

        this.svg.innerHTML = '';

        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

        const glowFilter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        glowFilter.setAttribute('id', 'glow');
        const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
        feGaussianBlur.setAttribute('stdDeviation', '3');
        feGaussianBlur.setAttribute('result', 'coloredBlur');
        const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
        const feMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
        feMergeNode1.setAttribute('in', 'coloredBlur');
        const feMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
        feMergeNode2.setAttribute('in', 'SourceGraphic');
        feMerge.appendChild(feMergeNode1);
        feMerge.appendChild(feMergeNode2);
        glowFilter.appendChild(feGaussianBlur);
        glowFilter.appendChild(feMerge);
        defs.appendChild(glowFilter);

        const arrowMarker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        arrowMarker.setAttribute('id', 'arrowhead');
        arrowMarker.setAttribute('markerWidth', '10');
        arrowMarker.setAttribute('markerHeight', '7');
        arrowMarker.setAttribute('refX', '9');
        arrowMarker.setAttribute('refY', '3.5');
        arrowMarker.setAttribute('orient', 'auto');
        const arrowPolygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        arrowPolygon.setAttribute('points', '0 0, 10 3.5, 0 7');
        arrowPolygon.setAttribute('fill', '#606070');
        arrowMarker.appendChild(arrowPolygon);
        defs.appendChild(arrowMarker);

        this.svg.appendChild(defs);

        const edgesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        edgesGroup.setAttribute('class', 'edges');

        level.edges.forEach(edge => {
            const fromNode = level.nodes.find(n => n.id === edge.from);
            const toNode = level.nodes.find(n => n.id === edge.to);

            if (!fromNode || !toNode) return;

            const isPathEdge = gameState.pathEdges.some(
                pe => (pe.from === edge.from && pe.to === edge.to) ||
                      (pe.from === edge.to && pe.to === edge.from)
            );

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', fromNode.x);
            line.setAttribute('y1', fromNode.y);
            line.setAttribute('x2', toNode.x);
            line.setAttribute('y2', toNode.y);
            line.setAttribute('class', `edge ${isPathEdge ? 'edge-path' : ''}`);

            if (isPathEdge) {
                line.setAttribute('stroke', '#c44536');
                line.setAttribute('stroke-width', '3');
                line.setAttribute('filter', 'url(#glow)');
            }

            const midX = (fromNode.x + toNode.x) / 2;
            const midY = (fromNode.y + toNode.y) / 2;

            const costBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            costBg.setAttribute('cx', midX);
            costBg.setAttribute('cy', midY);
            costBg.setAttribute('r', '12');
            costBg.setAttribute('fill', '#141420');
            costBg.setAttribute('stroke', '#8b8b9a');
            costBg.setAttribute('stroke-width', '1');

            const costText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            costText.setAttribute('x', midX);
            costText.setAttribute('y', midY + 4);
            costText.setAttribute('text-anchor', 'middle');
            costText.setAttribute('font-size', '11');
            costText.setAttribute('fill', '#d4a017');
            costText.setAttribute('font-family', 'ZCOOL XiaoWei, serif');
            costText.textContent = edge.cost;

            edgesGroup.appendChild(line);
            edgesGroup.appendChild(costBg);
            edgesGroup.appendChild(costText);
        });

        this.svg.appendChild(edgesGroup);

        const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        nodesGroup.setAttribute('class', 'nodes');

        const reachableNodes = gameState.reachableNodes || [];
        const reachableIds = reachableNodes.map(n => n.nodeId);

        level.nodes.forEach(node => {
            const isVisited = gameState.visitedNodes && gameState.visitedNodes.includes(node.id);
            const isCurrent = gameState.currentNode === node.id;
            const isReachable = reachableIds.includes(node.id);
            const hasEvent = node.event && !isVisited;

            const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            nodeGroup.setAttribute('class', 'node-group');
            nodeGroup.setAttribute('data-node-id', node.id);

            let nodeShape = null;

            if (node.type === 'start') {
                nodeShape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                nodeShape.setAttribute('points', `${node.x},${node.y - 18} ${node.x - 16},${node.y + 12} ${node.x + 16},${node.y + 12}`);
                nodeShape.setAttribute('class', 'node-start');
            } else if (node.type === 'end') {
                nodeShape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                nodeShape.setAttribute('x', node.x - 16);
                nodeShape.setAttribute('y', node.y - 16);
                nodeShape.setAttribute('width', '32');
                nodeShape.setAttribute('height', '32');
                nodeShape.setAttribute('class', 'node-end');
                nodeShape.setAttribute('transform', `rotate(45 ${node.x} ${node.y})`);
            } else {
                nodeShape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                nodeShape.setAttribute('cx', node.x);
                nodeShape.setAttribute('cy', node.y);
                nodeShape.setAttribute('r', '18');
                nodeShape.setAttribute('class', 'node-normal');

                if (isCurrent) {
                    nodeShape.setAttribute('class', 'node-current');
                } else if (isReachable) {
                    nodeShape.setAttribute('class', 'node-reachable');
                    nodeGroup.style.cursor = 'pointer';
                } else if (isVisited) {
                    nodeShape.setAttribute('class', 'node-visited');
                }

                if (hasEvent) {
                    const eventDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    eventDot.setAttribute('cx', node.x + 12);
                    eventDot.setAttribute('cy', node.y - 12);
                    eventDot.setAttribute('r', '6');
                    eventDot.setAttribute('fill', '#7b5ea7');
                    eventDot.setAttribute('stroke', '#fff');
                    eventDot.setAttribute('stroke-width', '2');
                    nodeGroup.appendChild(eventDot);
                }
            }

            if (isReachable && this.onNodeClick) {
                nodeGroup.addEventListener('click', () => {
                    this.onNodeClick(node.id);
                });
            }

            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', node.x);
            label.setAttribute('y', node.y + 35);
            label.setAttribute('class', `node-label ${node.type === 'start' ? 'node-label-start' : ''} ${node.type === 'end' ? 'node-label-end' : ''}`);
            label.textContent = node.name;

            nodeGroup.appendChild(nodeShape);
            nodeGroup.appendChild(label);
            nodesGroup.appendChild(nodeGroup);
        });

        this.svg.appendChild(nodesGroup);
    },

    highlightPath(fromNode, toNode) {
    }
};
