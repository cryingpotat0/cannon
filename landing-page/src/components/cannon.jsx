// import { Cannon, Language, getTemplate } from "../../../frontend/lib/main";
import { Cannon, Language, getTemplate } from "cannon-codeeditor";
import "cannon-codeeditor/dist/style.css";
import "./cannon.css";
import { useEffect, useRef, useState } from "react";

export default function CannonSection() {
    const [language, setLanguage] = useState(Language.Javascript);
    const [iframeRef, setIframeRef] = useState();
    const [languageProps, setLanguageProps] = useState({
        language: Language.Rust
    });
    useEffect(() => {
        if (languageProps.language === language) {
            return;
        }
        if (language === Language.Javascript && iframeRef) {
            setLanguageProps({
                language: Language.Javascript,
                iframe: iframeRef,
            });
        } else {
            setLanguageProps({
                language,
            });
        }
    }, [language, iframeRef]);


    const activeCss = "bg-primary text-white";
    const inactiveCss = "bg-white text-primary";

    return (
        <section
            id="intro"
            className="flex flex-col lg:grid lg:grid-cols-6 scroll-mt-24 gap-10 justify-center align-middle"
        >
            <div className="lg:col-span-4 justify-center w-full relative">
                <div className="absolute -top-10 left-0 right-0 z-10">
                    <div className="flex justify-center space-x-0 p-4">
                        <button
                            className={"py-2 px-4 rounded-l focus:outline-none focus:shadow-outline " + (language === Language.Rust ? activeCss : inactiveCss)}
                            type="button"
                            disabled={language === Language.Rust}
                            onClick={() => {
                                setLanguage(Language.Rust);
                            }}
                        >
                            Rust
                        </button>
                        <button
                            className={"py-2 px-4 rounded-r  focus:outline-none focus:shadow-outline " + (language === Language.Javascript ? activeCss : inactiveCss)}
                            type="button"
                            disabled={language === Language.Javascript}
                            onClick={() => {
                                setLanguage(Language.Javascript,);
                            }}
                        >
                            React
                        </button>
                    </div>
                </div>

                <div id="cannon-codeeditor" className="mt-12">
                    {languageProps.language && <Cannon
                        key={languageProps.language}
                        languageProps={languageProps}
                        initialFiles={getTemplate(languageProps.language).initialFiles}
                        initialOutput={getTemplate(languageProps.language).initialOutput}
                    />}
                </div>
            </div>
            <div className="flex-1 flex lg:col-span-2 flex-col items-center gap-4">
                <>
                    <div className={language !== Language.Javascript ? "hidden" : "w-full h-96 mt-12"}>
                        <iframe ref={newRef => setIframeRef(newRef)} className={"w-full h-full"} />
                    </div>
                    <div className={language === Language.Javascript ? "hidden" : "w-full h-96 mt-12"}>
                        <h2
                            className="gradient-text text-center font-extrabold tracking-tight text-6xl leading-tight"
                        >
                            Build Better Blogs.
                        </h2>
                        <p className="max-w-xl m-auto text-center font-extrabold text-xl leading-tight">
                            Cannon is a new kind of code viewer <br />
                            for the modern web. <br />
                            View, edit and run your code <br />
                            within the comfort of Chrome. <br />
                        </p>
                    </div>
                </>
            </div>
        </section>
    )
}




