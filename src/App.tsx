import { useState, useEffect, useMemo, type ReactNode, type ComponentType } from 'react';
import { Brain, Target, FunctionSquare, LineChart, ChevronUp, Database, Network, PlayCircle, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    Plotly?: {
      newPlot: (
        plotId: string,
        data: any[],
        layout: any,
        config?: any
      ) => void;
    };
  }
}

const Equation = ({ children }: { children: ReactNode }) => (
  <div className="py-4 overflow-x-auto text-center font-serif text-lg tracking-wide text-slate-700 bg-slate-50 rounded-lg my-4 border border-slate-200 shadow-inner">
    {children}
  </div>
);

const Section = ({
  id,
  title,
  icon: Icon,
  children,
}: {
  id: string;
  title: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  children: ReactNode;
}) => (
  <section id={id} className="py-12 border-b border-slate-200 last:border-0 scroll-mt-20">
    <div className="flex items-center gap-3 mb-8">
      <div className="p-3 bg-blue-100 text-blue-700 rounded-lg shadow-sm">
        <Icon size={24} />
      </div>
      <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
    </div>
    {children}
  </section>
);


// 核心組件：Plotly 3D 互動繪圖引擎
const Interactive3DPlot = ({
  plotId,
  data,
  layout = {},
}: {
  plotId: string;
  data: any[];
  layout?: any;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!window.Plotly) {
      const script = document.createElement('script');
      script.src = "https://cdn.plot.ly/plotly-2.32.0.min.js";
      script.async = true;
      script.onload = () => setIsLoaded(true);
      document.body.appendChild(script);
    } else {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && window.Plotly) {
      window.Plotly.newPlot(plotId, data, {
        ...layout,
        margin: { l: 0, r: 0, b: 0, t: 0 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        scene: {
          xaxis: { title: 'a', backgroundcolor: "white", gridcolor: "#e2e8f0", showbackground: true },
          yaxis: { title: 'b', backgroundcolor: "white", gridcolor: "#e2e8f0", showbackground: true },
          zaxis: { title: 'c', backgroundcolor: "white", gridcolor: "#e2e8f0", showbackground: true },
          camera: { eye: { x: 1.5, y: -1.5, z: 0.8 } }
        }
      }, { displayModeBar: false, responsive: true });
    }
  }, [isLoaded, data, layout, plotId]);

  return (
    <div className="w-full h-full relative flex items-center justify-center min-h-[250px]">
      {!isLoaded && <div className="absolute flex flex-col items-center text-blue-500"><Loader2 className="animate-spin mb-2" />Loading 3D Engine...</div>}
      <div id={plotId} className="w-full h-full absolute inset-0"></div>
    </div>
  );
};

export default function App() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [realCh13Data, setRealCh13Data] = useState(null); // 儲存 MATLAB 真實資料
  const [realCh60Data, setRealCh60Data] = useState(null);
  const [realCh21Data, setRealCh21Data] = useState(null);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

 // 預設讀取 public/data 內的 Ch13、Ch60、Ch21 JSON
useEffect(() => {
  const fetchRealData = async () => {
    try {
      const [res13, res60, res21] = await Promise.all([
        fetch('/data/Ch13_data_filtered_0.2.json'),
        fetch('/data/Ch60_data_filtered_0.2.json'),
        fetch('/data/Ch21_data_filtered_0.2.json'),
      ]);

      if (res13.ok) {
        const json13 = await res13.json();
        if (json13 && json13.x && json13.y && json13.z) {
          setRealCh13Data(json13);
        }
      }

      if (res60.ok) {
        const json60 = await res60.json();
        if (json60 && json60.x && json60.y && json60.z) {
          setRealCh60Data(json60);
        }
      }

      if (res21.ok) {
        const json21 = await res21.json();
        if (json21 && json21.x && json21.y && json21.z) {
          setRealCh21Data(json21);
        }
      }

    } catch (err) {
      console.log("未在本地 public/data 偵測到完整 JSON。目前使用模擬流形數據。");
    }
  };

  fetchRealData();
}, []);

  // 模擬數據 (如果沒有找到您的 JSON，就暫時顯示這個高階流形)
  const { ch13Demo, ch60Demo, ch21Demo } = useMemo(() => {
    const generateManifold = (numPoints: number, noiseLevel: number, shiftBase = 0) => {
      const x = [], y = [], z = [], c = [];
      for (let i = 0; i < numPoints; i++) {
        const a = Math.random() * 0.4 + 0.05;
        const b = Math.random() * 8 + 1;
        const base_c = (8 / (a + 0.1)) + shiftBase; 
        const actual_c = base_c + (Math.random() - 0.5) * noiseLevel;
        x.push(a); y.push(b); z.push(actual_c);
        c.push(actual_c); 
      }
      return { x, y, z, c };
    };
    return { 
      ch13Demo: generateManifold(350, 4, 0),
      ch60Demo: generateManifold(350, 5, 2),
      ch21Demo: generateManifold(350, 20, 15)
    };
  }, []);

  const currentCh13 = realCh13Data || ch13Demo;
  const currentCh60 = realCh60Data || ch60Demo;
  const currentCh21 = realCh21Data || ch21Demo;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-600">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <span className="font-bold text-blue-800 text-lg tracking-tight">14th TWSIAM</span>
            <div className="hidden md:flex space-x-6 text-sm font-medium text-slate-500">
              <a href="#abstract" className="hover:text-blue-600 transition-colors">Abstract</a>
              <a href="#data" className="hover:text-blue-600 transition-colors">Data</a>
              <a href="#method" className="hover:text-blue-600 transition-colors">Method</a>
              <a href="#results" className="hover:text-blue-600 transition-colors">Results</a>
              <a href="#conclusion" className="hover:text-blue-600 transition-colors">Conclusion</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="bg-gradient-to-b from-blue-900 to-slate-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-800/50 border border-blue-400/30 text-blue-200 text-sm font-semibold mb-4">
            大學生組
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
            Phase-Level Fitting of MEG Finger-Lifting Signals <br className="hidden md:block" />
            <span className="text-blue-300 font-light">Using a Time-Scaled Rössler-Type Oscillator</span>
          </h1>
          <div className="pt-6 space-y-2">
            <p className="text-xl font-medium text-slate-200">
              Chi-En Hsu, Tsung-Shan Yang, and Shyan-Shiou Chen*
            </p>
            <p className="text-blue-200/80 text-sm md:text-base">
              Department of Mathematics, National Taiwan Normal University (*Advisor)
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-white shadow-xl shadow-slate-200/50 -mt-10 rounded-2xl relative z-10 mb-20">
        
        {/* Abstract */}
        <Section id="abstract" title="Abstract" icon={Brain}>
          <p className="text-lg leading-relaxed text-slate-700 text-left">
            This study investigates the <strong className="text-slate-900">nonlinear phase dynamics</strong> of magnetoencephalography (MEG) signals during a <strong className="text-slate-900">2 Hz finger-lifting task</strong>. Physiologically, this motor action induces a dominant 4 Hz rhythm in the motor cortex, corresponding to the "lift-and-release" kinematic phases of the movement cycle. 
            <br /><br />
            To characterize these neural oscillations, we employ a <strong className="text-slate-900">time-scaled Rössler-type oscillator</strong> as a low-dimensional surrogate model. Leveraging its phase-coherent attractor structure, our framework effectively reconstructs the phase progression of the MEG signals. By jointly fitting waveform, frequency, and phase, we reveal that the optimized parameters form non-random, channel-dependent geometric structures. This suggests that the synchronous characteristics of neural signals may be reflected in the geometric configurations within the parameter space of the dynamic system.
          </p>
        </Section>

        {/* Data & Preprocessing */}
        <Section id="data" title="Data Feature & Preprocessing" icon={Database}>
          <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <PlayCircle size={20} className="text-blue-600" /> Experimental Setup
              </h3>
              <div className="space-y-2">
                <div className="aspect-video w-full rounded-xl overflow-hidden shadow-md border border-slate-200 bg-slate-900">
                  <iframe 
                    width="100%" height="100%" 
                    src="https://www.youtube.com/embed/SDI0TGnbibs" 
                    title="2 Hz Finger-Lifting Task" frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowFullScreen></iframe>
                </div>
              </div>
              <div className="pt-4 space-y-2 border-t border-slate-100 relative">
                <img
  src="/images/brain.png"
  alt="Brain topography"
  className="w-full rounded-xl shadow-md border border-slate-200"
/>
              </div>
            </div>
            
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800">Preprocessing Pipeline</h3>
              <ul className="space-y-4">
                {[
                  { title: 'Normalization', desc: 'Signals standardized to zero mean and unit variance.' },
                  { title: 'Channel Selection', desc: 'Ch13 used as reference due to clear 1:2 phase synchronization with sEMG.' },
                  { title: 'Band-pass Filtering', desc: '3–5 Hz filter applied to isolate the 4 Hz rhythm.' }
                ].map((step, idx) => (
                  <li key={idx} className="flex gap-4 bg-slate-50 p-5 rounded-xl border border-slate-100">
                    <div className="mt-0.5 bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-sm">{idx + 1}</div>
                    <div>
                      <strong className="text-slate-800 block text-lg mb-1">{step.title}</strong>
                      <span className="text-sm text-slate-600 leading-relaxed">{step.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {/* Method & Equations */}
        <Section id="method" title="Model and Method" icon={FunctionSquare}>
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Time-Scaled Rössler-Type Model</h3>
                <p className="text-slate-600">Based on a reduced oscillator with a single global time-scaling parameter <i className="font-serif">τ</i>.</p>
              </div>
              <Equation>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-2 px-4">
                  <div className="text-left shrink-0">
                    dx/dt = τ ( -y - z )<br /> dy/dt = τ ( x + ay )<br /> dz/dt = τ ( b + z(x - c) )
                  </div>
                  <div className="w-full sm:w-40 shrink-0">
                    <img
  src="/images/rossler.png"
  alt="Rossler attractor"
  className="w-full rounded-xl shadow-md border border-slate-200"
/>
                  </div>
                </div>
              </Equation>
            </div>
            <div className="bg-slate-800 text-slate-100 p-6 rounded-2xl shadow-xl">
              <h3 className="text-xl font-bold text-blue-300 mb-4 flex items-center gap-2"><Target size={24} /> Parameter Estimation</h3>
              <p className="text-sm text-slate-300 mb-4">Employed the Levenberg-Marquardt algorithm evaluating waveform, frequency, and phase.</p>
              <div className="bg-slate-900/80 p-5 rounded-xl font-serif text-sm overflow-x-auto text-blue-100 border border-slate-700">
                J(θ) = λ<sub>y</sub>² ∫ [ y<sub>data</sub> - ỹ<sub>model</sub> ]² dt <br/>
                <span className="pl-8">+ λ<sub>f</sub>² [ f<sub>dom</sub> - f<sub>target</sub> ]² </span><br/>
                <span className="pl-8">+ λ<sub>φ</sub>² ∫ [ W(φ<sub>data</sub> - φ<sub>model</sub>) ]² dt</span>
                   <p className="font-serif border-t border-slate-700 pt-2">
                  W(α) = α − 2π⌊(α + π) / 2π⌋
                  </p>

    <p className="italic">
      is the principal phase-value mapping.
    </p> 
              </div>
            </div>
          </div>
        </Section>

        {/* Results 區塊 */}
        <Section id="results" title="Interactive 3D Parameter Space" icon={LineChart}>
          <div className="space-y-6">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-slate-600 text-lg">
                  Filtered parameters reveal channel-dependent structures: <strong className="text-blue-600">Ch13 and Ch60 are highly similar</strong>, while Ch21 exhibits a distinct geometry.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* 互動 3D 圖 1: 主通道 Ch13 */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[350px]">
                <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center px-4 font-semibold text-sm text-slate-700">
                  <span>Ch13 Distribution</span>
                </div>
                <div className="flex-1 relative cursor-move">
                  <Interactive3DPlot 
                    plotId="plot-ch13"
                    data={[{
                      x: currentCh13.x, y: currentCh13.y, z: currentCh13.z,
                      mode: 'markers', type: 'scatter3d',
                      marker: { size: 3,  colorscale: 'Viridis', opacity: 0.8 }
                    }]}
                  />
                </div>
              </div>

              {/* 互動 3D 圖 2: Ch13 vs Ch60 */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[350px]">
                <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center px-4 font-semibold text-sm text-slate-700">
                  <span>Ch13 vs Ch60 (Similar)</span>
                </div>
                <div className="flex-1 relative cursor-move">
                  <Interactive3DPlot 
                    plotId="plot-ch13-ch60"
                    data={[
                      {
                        name: 'Ch13', x: currentCh13.x, y: currentCh13.y, z: currentCh13.z,
                        mode: 'markers', type: 'scatter3d',
                        marker: { size: 3, color: '#3b82f6', opacity: 0.7 }
                      },
                      {
                        name: 'Ch60', x: currentCh60.x, y: currentCh60.y, z: currentCh60.z,
                        mode: 'markers', type: 'scatter3d',
                        marker: { size: 3, color: '#f97316', opacity: 0.7 }
                      }
                    ]}
                  />
                </div>
              </div>

              {/* 互動 3D 圖 3: Ch13 vs Ch21 */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[350px]">
                <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center px-4 font-semibold text-sm text-slate-700">
                  <span>Ch13 vs Ch21 (Distinct)</span>
                </div>
                <div className="flex-1 relative cursor-move">
                  <Interactive3DPlot 
                    plotId="plot-ch13-ch21"
                    data={[
                      {
                        name: 'Ch13', x: currentCh13.x, y: currentCh13.y, z: currentCh13.z,
                        mode: 'markers', type: 'scatter3d',
                        marker: { size: 3, color: '#3b82f6', opacity: 0.7 }
                      },
                      {
                        name: 'Ch21', x: currentCh21.x, y: currentCh21.y, z: currentCh21.z,
                        mode: 'markers', type: 'scatter3d',
                        marker: { size: 3, color: '#ef4444', opacity: 0.7 }
                      }
                    ]}
                  />
                </div>
              </div>

            </div>
          </div>
        </Section>

        {/* Conclusion 區塊 */}
        <Section id="conclusion" title="Conclusion" icon={Network}>
          <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 p-8 rounded-2xl shadow-sm">
            <ul className="space-y-6 text-slate-700 text-base md:text-lg">
              <li className="flex gap-4 items-start">
                <span className="text-blue-500 font-bold text-xl mt-0.5">✓</span>
                <span>
                  Building on motor MEG–sEMG <strong>1:2 phase synchronization</strong>, the <strong>time-scaled Rössler-type oscillator</strong> captures the <strong>~4 Hz MEG phase evolution</strong> during 2 Hz finger-tapping.
                </span>
              </li>
              <li className="flex gap-4 items-start">
                <span className="text-blue-500 font-bold text-xl mt-0.5">✓</span>
                <span>
                  Fitted parameters form <strong>non-random curved surfaces</strong>, mapping motor dynamics to a <strong>stable parameter space</strong>.
                </span>
              </li>
              <li className="flex gap-4 items-start">
                <span className="text-blue-500 font-bold text-xl mt-0.5">✓</span>
                <span>
                  The <strong>highly similar parameter surfaces</strong> of Ch13 and Ch60 confirm that <strong>sEMG-synchronized channels</strong> share <strong>specific dynamic patterns</strong>.
                </span>
              </li>
              <li className="flex gap-4 items-start">
                <span className="text-blue-500 font-bold text-xl mt-0.5">✓</span>
                <span>
                  Finally, the <strong>statistically invariant distribution</strong> (<em>p</em> &gt; 0.05) of parameter <em>a</em> across co-activated regions (Ch13, Ch60, Ch28) links peripheral synchronization to a <strong>consistent neural-dynamic structure</strong>.
                </span>
              </li>
            </ul>
          </div>
        </Section>
      </main>

      {/* Scroll to Top */}
      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 bg-blue-600 text-white rounded-full shadow-2xl hover:bg-blue-700 transition-all z-50 duration-300"
        >
          <ChevronUp size={24} />
        </button>
      )}
    </div>
  );
}