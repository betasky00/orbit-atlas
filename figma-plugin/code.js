// Orbit Atlas - Figma Plugin (compiled from code.ts)
// Injects generated carousel content (texts + image URLs) into named layers,
// and notifies the Orbit Atlas workflow once the user validates the edits.
//
// Layer naming convention expected in the Figma file:
// Frame name : matches "figmaFrameName" from the SlideTemplate (e.g. edu-minimal_slide_1_hook)
// Text layer : "SLOT_<NAME>" (e.g. SLOT_TITRE_ACCROCHE)
// Image layer : "SLOT_IMAGE_<index>" (e.g. SLOT_IMAGE_1) - must be a shape with a fill

const ORBIT_API_BASE = "https://YOUR-APP-DOMAIN.vercel.app";

figma.showUI(__html__, { width: 360, height: 420 });

async function fetchWorkflowData(workflowId) {

  const res = await fetch(`${ORBIT_API_BASE}/api/workflow/${workflowId}/figma-data`);
    if (!res.ok) {
          throw new Error(`Unable to fetch workflow data (status ${res.status})`);
    }
    return res.json();
}

async function setTextInNode(node, value) {
    await figma.loadFontAsync(node.fontName);
    node.characters = value;
}

async function setImageInNode(node, url) {
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const image = figma.createImage(bytes);

  if ("fills" in node) {
        const fills = [
          {
                    type: "IMAGE",
                    scaleMode: "FILL",
                    imageHash: image.hash,
          },
              ];
        node.fills = fills;
  }
}

function findFrameByName(name) {
    const match = figma.currentPage.findOne(
          (n) => n.type === "FRAME" && n.name === name
        );
    return match ?? null;
}

function findSlotLayer(frame, slotName) {
    const layerName = `SLOT_${slotName}`;
    const match = frame.findOne((n) => n.name === layerName);
    return match ?? null;
}

async function injectSlideData(slide) {
    const frame = findFrameByName(slide.figmaFrameName);
    if (!frame) {
          figma.notify(`Frame not found: ${slide.figmaFrameName}`, { timeout: 4000 });
          return;
    }

  for (const slot of slide.slots) {
        const layer = findSlotLayer(frame, slot.name);
        if (!layer) {
                figma.notify(`Layer not found: SLOT_${slot.name}`, { timeout: 3000 });
                continue;
        }

      if (slot.type === "text" && layer.type === "TEXT") {
              await setTextInNode(layer, slot.value);
      } else if (slot.type === "image") {
              await setImageInNode(layer, slot.value);
      }
  }
}

async function injectAllSlides(payload) {
    for (const slide of payload.slides) {
          await injectSlideData(slide);
    }
    figma.notify("Content injected from Orbit Atlas");
}

async function exportFrameAsPng(frame) {
    return frame.exportAsync({ format: "PNG", constraint: { type: "SCALE", value: 2 } });
}

async function exportAllSlidesAndNotify(workflowId, payload) {
    const exports = [];

  for (const slide of payload.slides) {
        const frame = findFrameByName(slide.figmaFrameName);
        if (!frame) continue;
        const bytes = await exportFrameAsPng(frame);
        const base64 = figma.base64Encode(bytes);
        exports.push({ figmaFrameName: slide.figmaFrameName, base64 });
  }

  const res = await fetch(`${ORBIT_API_BASE}/api/workflow/${workflowId}/figma-approved`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exports }),
  });

  if (!res.ok) {
        throw new Error(`Failed to notify the workflow (status ${res.status})`);
  }
}

figma.ui.onmessage = async (msg) => {
    try {
          if (msg.type === "load-workflow" && msg.workflowId) {
                  figma.notify("Loading content...");
                  const payload = await fetchWorkflowData(msg.workflowId);
                  await injectAllSlides(payload);
                  figma.ui.postMessage({ type: "loaded", success: true });
          }

      if (msg.type === "validate" && msg.workflowId) {
              figma.notify("Exporting and validating...");
              const payload = await fetchWorkflowData(msg.workflowId);
              await exportAllSlidesAndNotify(msg.workflowId, payload);
              figma.notify("Workflow validated, back to Orbit Atlas");
              figma.ui.postMessage({ type: "validated", success: true });
      }

      if (msg.type === "close") {
              figma.closePlugin();
      }
    } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          figma.notify(`Error: ${message}`, { timeout: 5000, error: true });
          figma.ui.postMessage({ type: "error", message });
    }
};
