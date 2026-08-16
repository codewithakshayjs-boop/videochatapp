import { useEffect, useRef, useState } from 'react';

const BLOCKED_CATEGORIES = { Porn: 0.7, Hentai: 0.7, Sexy: 0.8 };
const MODEL_URL = 'https://cdn.jsdelivr.net/gh/infinitered/nsfwjs@master/models/mobilenet_v2/model.json';
const TFJS_URL = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
const NSFWJS_URL = 'https://cdn.jsdelivr.net/npm/nsfwjs@4.3.0/dist/browser/nsfwjs.min.js';
const scriptLoads = new Map();

function loadScript(url, globalName) {
  if (window[globalName]) return Promise.resolve(window[globalName]);
  if (scriptLoads.has(url)) return scriptLoads.get(url);
  const load = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => resolve(window[globalName]);
    script.onerror = () => reject(new Error(`Unable to load ${globalName}`));
    document.head.appendChild(script);
  });
  scriptLoads.set(url, load);
  return load;
}

function isUnsafe(predictions) {
  return predictions.some(({ className, probability }) => probability >= (BLOCKED_CATEGORIES[className] ?? Number.POSITIVE_INFINITY));
}

export function useNsfwDetection({ enabled, videoRefs, onSafetyChange }) {
  const model = useRef(null);
  const scanning = useRef(false);
  const callback = useRef(onSafetyChange);
  const [ready, setReady] = useState(false);

  useEffect(() => { callback.current = onSafetyChange; }, [onSafetyChange]);
  useEffect(() => {
    let active = true;
    if (!enabled || model.current) return undefined;
    loadScript(TFJS_URL, 'tf')
      .then(() => loadScript(NSFWJS_URL, 'nsfwjs'))
      .then((nsfwjs) => nsfwjs.load(MODEL_URL))
      .then((loadedModel) => {
      if (!active) return;
      model.current = loadedModel;
      setReady(true);
    }).catch(() => { if (active) setReady(false); });
    return () => { active = false; };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !ready) return undefined;
    const inspect = async () => {
      if (scanning.current || !model.current) return;
      const sources = videoRefs.map(({ source, ref }) => ({ source, video: ref.current }))
        .filter(({ video }) => video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA);
      if (!sources.length) return;
      scanning.current = true;
      try {
        for (const { source, video } of sources) {
          const predictions = await model.current.classify(video);
          callback.current?.({ source, unsafe: isUnsafe(predictions), predictions });
        }
      } catch {
        // Frame and decoder failures are retried during the next scan.
      } finally { scanning.current = false; }
    };
    inspect();
    const interval = window.setInterval(inspect, 1500);
    return () => window.clearInterval(interval);
  }, [enabled, ready, videoRefs]);
  return { ready };
}
