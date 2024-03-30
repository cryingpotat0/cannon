import { useEffect, useRef } from 'react';
import { EditorView, Panel, showPanel } from '@codemirror/view';
import { StateEffect } from "@codemirror/state"
import { createRoot } from 'react-dom/client';


export const setActiveTabEffect = StateEffect.define<string>()

const TabSwitcher = (
  {
    setActiveTab,
    tabs,
    activeTab
  }: { setActiveTab: (tab: string) => void, tabs: string[], activeTab: string }
) => {
  console.log('tabswitcher active tab', activeTab);
  const activeTabRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    console.log('ref is ', activeTabRef.current);
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  }, [activeTabRef.current]);
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
            setActiveTab(tab)
          }}
          style={{
            cursor: 'pointer',
            padding: '0.3rem 0.3rem',
            fontWeight: activeTab === tab ? 'bold' : 'normal',
            marginRight: '0.5rem', // Adds spacing between tabs
            backgroundColor: activeTab === tab ? 'inherit' : 'transparent',
            fontFamily: 'monospace',
          }}
          ref={activeTab === tab ? activeTabRef : null}
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
}: { setActiveTab: (tab: string) => void, tabs: string[], activeTab: string }) {
  return function headerPanel(_view: EditorView): Panel {
    let dom = document.createElement("div")
    let root = createRoot(dom);
    return {
      dom,
      top: true,
      update(update) {
        for (let t of update.transactions) {
          for (let e of t.effects) {
            if (e.is(setActiveTabEffect)) {
              root.render(<TabSwitcher tabs={tabs} activeTab={e.value} setActiveTab={setActiveTab} />);
            }
          }
        }
      }
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
