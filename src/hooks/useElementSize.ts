import { useCallback, useEffect, useState, type RefCallback } from "react";

interface ElementSize {
	width: number;
	height: number;
}

export function useElementSize<T extends HTMLElement = HTMLDivElement>() {
	const [node, setNode] = useState<T | null>(null);
	const [size, setSize] = useState<ElementSize | null>(null);

	const ref = useCallback<RefCallback<T>>((element) => {
		setNode(element);
		if (!element) {
			setSize(null);
		}
	}, []);

	useEffect(() => {
		if (!node) return;

		const observer = new ResizeObserver(([entry]) => {
			if (!entry) return;
			const { width, height } = entry.contentRect;
			setSize({ width, height });
		});

		observer.observe(node);

		return () => {
			observer.disconnect();
		};
	}, [node]);

	return { ref, size };
}
