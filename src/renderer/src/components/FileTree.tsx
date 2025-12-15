import React, { useState } from 'react';

interface FileNode {
    name: string;
    path: string;
    fullName: string;
    children: FileNode[];
    level: number;
}

interface FileTreeProps {
    files: { name: string; path: string }[];
    onFileClick: (filePath: string, fileName: string) => void;
    selectedFile: string | null;
}

const FileTree: React.FC<FileTreeProps> = ({ files, onFileClick, selectedFile }) => {
    const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

    const buildTree = (files: { name: string; path: string }[]): FileNode[] => {
        const root: FileNode[] = [];
        const nodeMap = new Map<string, FileNode>();
        const filePathMap = new Map<string, string>();

        // First pass: map all file paths
        files.forEach(file => {
            const nameWithoutExt = file.name.replace('.md', '');
            filePathMap.set(nameWithoutExt, file.path);
        });

        files.forEach(file => {
            const nameParts = file.name.replace('.md', '').split('.');
            let currentPath = '';

            nameParts.forEach((part, index) => {
                const previousPath = currentPath;
                currentPath = currentPath ? `${currentPath}.${part}` : part;
                const fullName = `${currentPath}.md`;

                if (!nodeMap.has(currentPath)) {
                    const node: FileNode = {
                        name: part,
                        path: filePathMap.get(currentPath) || '',
                        fullName: fullName,
                        children: [],
                        level: index
                    };

                    nodeMap.set(currentPath, node);

                    if (index === 0) {
                        root.push(node);
                    } else {
                        const parent = nodeMap.get(previousPath);
                        if (parent) {
                            parent.children.push(node);
                        }
                    }
                }
            });
        });

        return root;
    };

    const toggleCollapse = (nodePath: string): void => {
        setCollapsedNodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(nodePath)) {
                newSet.delete(nodePath);
            } else {
                newSet.add(nodePath);
            }
            return newSet;
        });
    };

    const renderNode = (node: FileNode, pathPrefix: string = ''): React.ReactNode => {
        const nodePath = pathPrefix ? `${pathPrefix}.${node.name}` : node.name;
        const isCollapsed = collapsedNodes.has(nodePath);
        const hasChildren = node.children.length > 0;
        const isActualFile = node.path !== '';
        const isSelected = isActualFile && selectedFile === node.path;

        return (
            <div key={nodePath}>
                <div
                    className={`file-item ${isSelected ? 'selected' : ''}`}
                    style={{ paddingLeft: `${node.level * 16 + 8}px` }}
                    onClick={() => isActualFile && onFileClick(node.path, node.fullName)}
                >
                    {hasChildren && (
                        <span
                            className={`file-item-arrow ${!isCollapsed ? 'expanded' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleCollapse(nodePath);
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M5 3l3.057-3 11.943 12-11.943 12-3.057-3 9-9z" />
                            </svg>
                        </span>
                    )}
                    <span className={hasChildren ? 'with-arrow' : 'no-arrow'}>
                        {node.name}
                    </span>
                    {isActualFile && (
                        <span className="file-indicator" title="File">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"><path fill="currentColor" d="M14.568.075c2.202 1.174 5.938 4.883 7.432 6.881-1.286-.9-4.044-1.657-6.091-1.179.222-1.468-.185-4.534-1.341-5.702zm-.824 7.925s1.522-8-3.335-8h-8.409v24h20v-13c0-3.419-5.247-3.745-8.256-3z" /></svg>
                        </span>
                    )}
                </div>
                {hasChildren && !isCollapsed && (
                    <div className="file-tree-children">
                        {node.children.map(child => renderNode(child, nodePath))}
                    </div>
                )}
            </div>
        );
    };

    const tree = buildTree(files);

    return (
        <div className="file-tree">
            {tree.map(node => renderNode(node))}
        </div>
    );
};

export default FileTree;