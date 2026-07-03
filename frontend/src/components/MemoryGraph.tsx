import React, { useEffect, useState, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { api } from '../lib/api';
import type { ProjectGraphResponse, GraphNode } from '../lib/api';
import { Network, Plus, Minus, Maximize, Search, BookOpen, AlertCircle } from 'lucide-react';
import { showToast } from '../lib/toast';

interface MemoryGraphProps {
  selectedProject: string;
  retireAnimationRef?: React.MutableRefObject<(() => Promise<void>) | null>;
  setActiveTab?: (tab: string) => void;
}

export const MemoryGraph: React.FC<MemoryGraphProps> = ({ selectedProject, retireAnimationRef, setActiveTab }) => {
  const [graphData, setGraphData] = useState<ProjectGraphResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [hoverNode, setHoverNode] = useState<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);

  // Search/filter in graph
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNodeDetails, setSelectedNodeDetails] = useState<GraphNode | null>(null);
  const [shrinkFactor, setShrinkFactor] = useState(1);

  const fetchGraph = async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      const data = await api.getProjectGraph(selectedProject);
      setGraphData(data);
    } catch {
      // Handled globally
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
    setSelectedNodeDetails(null);
    setShrinkFactor(1);
  }, [selectedProject]);

  // Register retire animation callback
  useEffect(() => {
    if (retireAnimationRef) {
      retireAnimationRef.current = async () => {
        if (fgRef.current) {
          fgRef.current.zoomToFit(200);
        }
        await new Promise<void>((resolve) => {
          import('framer-motion').then(({ animate }) => {
            animate(1, 0, {
              duration: 0.8,
              onUpdate: (latest) => setShrinkFactor(latest),
              onComplete: () => resolve(),
            });
          });
        });
      };
    }
    return () => {
      if (retireAnimationRef) {
        retireAnimationRef.current = null;
      }
    };
  }, [retireAnimationRef, fgRef]);

  useEffect(() => {
    if (containerRef.current) {
      const handleResize = () => {
        setDimensions({
          width: containerRef.current?.clientWidth || 800,
          height: Math.max(500, (window.innerHeight - 250)),
        });
      };
      
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [graphData]);

  // Find all links connected to a specific nodeId
  const getConnectedNodeIds = (nodeId: string): Set<string> => {
    const connected = new Set<string>();
    if (!graphData) return connected;
    graphData.links.forEach((link: any) => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      if (sourceId === nodeId) {
        connected.add(targetId);
      }
      if (targetId === nodeId) {
        connected.add(sourceId);
      }
    });
    return connected;
  };

  const connectedNodes = hoverNode ? getConnectedNodeIds(hoverNode.id) : new Set<string>();

  // Graph controls functions
  const handleZoomIn = () => {
    if (fgRef.current) {
      fgRef.current.zoom(fgRef.current.zoom() * 1.3, 400);
    }
  };

  const handleZoomOut = () => {
    if (fgRef.current) {
      fgRef.current.zoom(fgRef.current.zoom() / 1.3, 400);
    }
  };

  const handleResetZoom = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400);
      showToast('Centered graph context.', 'success');
    }
  };

  return (
    <div className="space-y-6 py-2 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 mb-1">
            Traceback Knowledge Graph
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Fuzzy cluster search, inspect nodes, and navigate interconnected error databases.
          </p>
        </div>

        {/* Search within graph input */}
        {selectedProject && graphData && graphData.nodes.length > 0 && (
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search nodes or tags..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-accent"
            />
            <Search className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 absolute left-2.5 top-2.5" />
          </div>
        )}
      </div>

      {!selectedProject ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 py-12 text-center text-neutral-400 text-xs rounded-xl">
          Please select or create a project to load the memory graph.
        </div>
      ) : loading ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 py-24 text-center text-neutral-400 text-xs space-y-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-center gap-2">
            <Network className="w-4 h-4 animate-spin text-accent" />
            <span>Parsing Cognee cloud database graph...</span>
          </div>
        </div>
      ) : !graphData || graphData.nodes.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800 py-16 text-center rounded-xl flex flex-col items-center justify-center space-y-4">
          <Network className="w-8 h-8 text-neutral-350 dark:text-neutral-600" />
          <div className="space-y-1 px-4">
            <span className="text-xs text-neutral-500 dark:text-neutral-450 block font-semibold">No bugs have been logged to this project's memory network yet.</span>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block max-w-sm mx-auto leading-normal">
              Once you confirm or manually record bug resolutions under **Find a Bug**, Cognee stores nodes representing your errors, files, and tags, forming an interactive memory network.
            </span>
          </div>
          <button
            onClick={() => setActiveTab?.('find-bug')}
            className="px-4 py-2 text-xs font-medium text-white bg-accent hover:bg-accent-hover rounded-lg shadow-sm transition-all"
          >
            Analyze a Traceback
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Canvas Wrapper */}
          <div 
            ref={containerRef}
            className="lg:col-span-3 border border-neutral-200 dark:border-neutral-850 bg-neutral-50 dark:bg-neutral-950 rounded-xl overflow-hidden relative shadow-sm"
          >
            {/* Legend & Help Overlay */}
            <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 text-[10px] text-neutral-500 dark:text-neutral-400 font-mono space-y-1.5 pointer-events-none select-none">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                <span>Primary Entity</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-400 dark:bg-neutral-600" />
                <span>Connected Node</span>
              </div>
            </div>

            {/* Custom Graph Toolbar Controls */}
            <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-1 rounded-lg shadow-md select-none">
              <button 
                onClick={handleZoomIn}
                className="p-1.5 rounded hover:bg-neutral-150 dark:hover:bg-neutral-850 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 transition-colors"
                title="Zoom In"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={handleZoomOut}
                className="p-1.5 rounded hover:bg-neutral-150 dark:hover:bg-neutral-850 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 transition-colors"
                title="Zoom Out"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={handleResetZoom}
                className="p-1.5 rounded hover:bg-neutral-150 dark:hover:bg-neutral-850 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 transition-colors"
                title="Fit View"
              >
                <Maximize className="w-3.5 h-3.5" />
              </button>
            </div>

            <ForceGraph2D
              ref={fgRef}
              graphData={graphData}
              width={dimensions.width}
              height={dimensions.height}
              onNodeHover={(node: any) => setHoverNode(node)}
              onNodeClick={(node: any) => {
                const nodeData = graphData.nodes.find((n) => n.id === node.id);
                if (nodeData) {
                  setSelectedNodeDetails(nodeData);
                }
              }}
              // Draw premium custom glowing nodes with inline text
              nodeCanvasObject={(node: any, ctx, globalScale) => {
                const label = node.label || '';
                const isHovered = hoverNode && hoverNode.id === node.id;
                const isConnected = hoverNode && connectedNodes.has(node.id);
                const isMatch = searchQuery 
                  ? label.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    node.tags?.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()))
                  : false;

                // Color configuration
                let fillStyle = '#94a3b8'; // default slate-400
                if (isHovered) fillStyle = '#14b8a6'; // teal-500
                else if (isConnected) fillStyle = '#0f766e'; // teal-700
                else if (searchQuery && isMatch) fillStyle = '#f59e0b'; // amber-500 highlight
                else if (searchQuery && !isMatch) fillStyle = '#cbd5e1'; // faded gray

                const size = (node.tags && node.tags.length > 0 ? 5 : 4) * (isHovered ? 1.4 : 1) * shrinkFactor;

                // Set global alpha for shrink / fade out transition
                ctx.globalAlpha = shrinkFactor;

                // Circle drawing
                ctx.beginPath();
                ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
                
                // Outer glow shadow
                ctx.shadowColor = isHovered ? '#14b8a6' : isMatch ? '#f59e0b' : 'transparent';
                ctx.shadowBlur = isHovered ? 14 : isMatch ? 10 : 0;

                ctx.fillStyle = fillStyle;
                ctx.fill();

                // Reset shadow blur for other drawings
                ctx.shadowBlur = 0;

                // Border accent ring
                ctx.lineWidth = 0.8;
                ctx.strokeStyle = isHovered ? '#fff' : '#e2e8f0';
                ctx.stroke();

                // Draw inline text label if zoomed in sufficiently
                if (globalScale > 1.2) {
                  const fontSize = 10 / globalScale;
                  ctx.font = `${fontSize}px Inter, sans-serif`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'top';
                  
                  // Label bounding background for high contrast
                  const labelY = node.y + size + 2;
                  const textWidth = ctx.measureText(label).width;
                  
                  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
                  ctx.fillRect(node.x - textWidth / 2 - 2, labelY - 1, textWidth + 4, fontSize + 2);
                  
                  ctx.fillStyle = isHovered ? '#0f766e' : '#1e293b';
                  ctx.fillText(label, node.x, labelY);
                }

                // Reset global alpha back to normal
                ctx.globalAlpha = 1.0;
              }}
              // Styled connector lines
              linkColor={(link: any) => {
                if (hoverNode) {
                  const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                  const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                  if (sourceId === hoverNode.id || targetId === hoverNode.id) {
                    return '#0f766e'; // Teal Accent
                  }
                  return '#f1f5f9'; // Very light/transparent
                }
                return '#e2e8f0'; // Default line gray
              }}
              linkWidth={(link: any) => {
                if (hoverNode) {
                  const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                  const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                  return sourceId === hoverNode.id || targetId === hoverNode.id ? 2.5 : 0.4;
                }
                return 1.2;
              }}
              cooldownTicks={120}
            />
          </div>

          {/* Sidebar Detail Card */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 p-4 rounded-xl shadow-sm space-y-4 self-stretch flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-xs uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Entity Details
              </h3>
              
              {selectedNodeDetails ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block mb-0.5">Entity Reference ID</span>
                    <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200 bg-neutral-50 dark:bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-200/50 dark:border-neutral-800 break-all">
                      {selectedNodeDetails.id}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block mb-0.5">Traceback Summary</span>
                    <p className="font-medium text-neutral-800 dark:text-neutral-200 leading-snug">
                      {selectedNodeDetails.label}
                    </p>
                  </div>
                  
                  {selectedNodeDetails.tags && selectedNodeDetails.tags.length > 0 && (
                    <div>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block mb-1">Tags</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedNodeDetails.tags.map((tag) => (
                          <span 
                            key={tag} 
                            className="px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/20 border border-teal-100/50 dark:border-teal-900/30 text-[10px] text-teal-700 dark:text-teal-400 font-mono"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-neutral-400 dark:text-neutral-500 text-xs border border-dashed border-neutral-100 dark:border-neutral-800 rounded-lg bg-neutral-50/20">
                  <AlertCircle className="w-5 h-5 mx-auto mb-2 text-neutral-300" />
                  <span>Select any node on the graph to inspect details.</span>
                </div>
              )}
            </div>

            {/* Entity counts */}
            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
              <span>Nodes: {graphData.nodes.length}</span>
              <span>Edges: {graphData.links.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
