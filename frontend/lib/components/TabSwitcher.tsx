import { useEffect, useRef, useState } from 'react';
import { EditorView, Panel, showPanel } from '@codemirror/view';
import { createRoot } from 'react-dom/client';

const TabSwitcher = (
  {
    setActiveTab,
    tabs,
    activeTab
  }: { setActiveTab: (tab: string) => void, tabs: string[], activeTab: string }
) => {
  let [internalActiveTab, setInternalActiveTab] = useState(activeTab);
  const activeTabRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  }, [activeTabRef.current, internalActiveTab]);
  return (
    <div style={{
      display: 'flex',
      overflowX: 'auto', // Enables horizontal scrolling
      padding: '0.25rem 1.25rem 0.5rem 1.25rem',
      whiteSpace: 'nowrap', // Ensures tabs are in a single line
      backgroundColor: 'inherit'
    }}>
      {tabs.map((tab, index) => (
        <div
          key={index}
          onClick={() => {
            setInternalActiveTab(tab)
            setActiveTab(tab)
          }}
          style={{
            cursor: 'pointer',
            padding: '0.3rem 0.3rem',
            fontWeight: internalActiveTab === tab ? 'bold' : 'normal',
            marginRight: '0.5rem', // Adds spacing between tabs
            backgroundColor: internalActiveTab === tab ? 'inherit' : 'transparent',
            fontFamily: 'monospace',
          }}
          ref={internalActiveTab === tab ? activeTabRef : null}
        >
          {tab}
        </div>
      ))}
    </div>
  );
};


function headerPanelGenerator({
  setActiveTab,
  tabs,
  activeTab
}: { setActiveTab: (tab: string) => void, tabs: string[], activeTab: string }) {
  return function headerPanel(_view: EditorView): Panel {
    let dom = document.createElement("div")
    let root = createRoot(dom);
    root.render(<TabSwitcher tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />);
    return {
      dom,
      top: true,
    }
  }
}


export default function header(
  args: {
    setActiveTab: (tab: string) => void,
    tabs: string[],
    activeTab: string
  }) {
  return showPanel.of(headerPanelGenerator(args))
}
