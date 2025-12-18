"use client";

import { useState } from 'react';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import { clsx } from 'clsx';

// Game Levels / Targets
const LEVELS = [
    {
        id: 'issuer',
        prompt: "Find and click the Entity ID of the Identity Provider.",
        hint: "Look for the <saml:Issuer> tag.",
        successMsg: "Correct! The Issuer identifies WHO is asserting the identity.",
        tag: 'saml:Issuer'
    },
    {
        id: 'nameid',
        prompt: "Find the unique identifier for the user.",
        hint: "We need to know WHO the user is. Look for <saml:NameID>.",
        successMsg: "Perfect! NameID is the core subject of the assertion (often an email).",
        tag: 'saml:NameID'
    },
    {
        id: 'attributes',
        prompt: "Find the section containing the user's details (Role, Department, etc.).",
        hint: "Look for the <saml:AttributeStatement> block.",
        successMsg: "Right! AttributeStatement contains the claims about the user.",
        tag: 'saml:AttributeStatement'
    },
    {
        id: 'signature',
        prompt: "Finally, find the cryptographic proof that verifies this message is trusted.",
        hint: "Security is key. Look for the <ds:Signature>.",
        successMsg: "Excellent! The Signature ensures integrity and authenticity.",
        tag: 'ds:Signature'
    }
];

const RAW_XML = `
<saml:Response xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
    ID="_6c3a4f8b9d" Version="2.0" IssueInstant="2024-03-20T10:00:00Z">
  <saml:Issuer>https://mocksaml.com/idp</saml:Issuer>
  <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
    <ds:SignedInfo>
      <ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
      <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
      <ds:Reference URI="#_6c3a4f8b9d">
        <ds:Transforms>
          <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
        </ds:Transforms>
        <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
        <ds:DigestValue>K8f...=</ds:DigestValue>
      </ds:Reference>
    </ds:SignedInfo>
    <ds:SignatureValue>M4j...</ds:SignatureValue>
  </ds:Signature>
  <saml:Status>
    <saml:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
  </saml:Status>
  <saml:Assertion ID="_a9b8c7d6" IssueInstant="2024-03-20T10:00:00Z" Version="2.0">
    <saml:Issuer>https://mocksaml.com/idp</saml:Issuer>
    <saml:Subject>
      <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">
        alice@example.com
      </saml:NameID>
      <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
        <saml:SubjectConfirmationData NotOnOrAfter="2024-03-20T10:05:00Z"
          Recipient="https://sp.example.com/acs"/>
      </saml:SubjectConfirmation>
    </saml:Subject>
    <saml:Conditions NotBefore="2024-03-20T09:55:00Z" NotOnOrAfter="2024-03-20T10:05:00Z">
      <saml:AudienceRestriction>
        <saml:Audience>https://sp.example.com</saml:Audience>
      </saml:AudienceRestriction>
    </saml:Conditions>
    <saml:AuthnStatement AuthnInstant="2024-03-20T09:59:00Z">
      <saml:AuthnContext>
        <saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef>
      </saml:AuthnContext>
    </saml:AuthnStatement>
    <saml:AttributeStatement>
      <saml:Attribute Name="firstName">
        <saml:AttributeValue>Alice</saml:AttributeValue>
      </saml:Attribute>
      <saml:Attribute Name="lastName">
        <saml:AttributeValue>Doe</saml:AttributeValue>
      </saml:Attribute>
      <saml:Attribute Name="role">
        <saml:AttributeValue>Admin</saml:AttributeValue>
      </saml:Attribute>
    </saml:AttributeStatement>
  </saml:Assertion>
</saml:Response>
`.trim();

export default function SAMLInspector() {
    const [levelIndex, setLevelIndex] = useState(0);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
    const [completed, setCompleted] = useState(false);

    const currentLevel = LEVELS[levelIndex];

    const handleLineClick = (lineContent: string) => {
        if (completed) return;

        const cleanContent = lineContent.trim();
        // Check if the clicked line contains the target tag (start or end tag)
        // We do a simple includes check, ensuring we match the tag name
        if (cleanContent.includes(currentLevel.tag) ||
            (currentLevel.tag === 'ds:Signature' && cleanContent.includes('ds:Signature'))) {

            setFeedback({ type: 'success', msg: currentLevel.successMsg });

            // Advance level after short delay
            setTimeout(() => {
                setFeedback(null);
                if (levelIndex < LEVELS.length - 1) {
                    setLevelIndex(prev => prev + 1);
                } else {
                    setCompleted(true);
                }
            }, 1500);
        } else {
            setFeedback({ type: 'error', msg: "Not quite. Check the tag names carefully!" });
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto flex gap-6 h-[600px]">
            {/* Left Panel: Game State */}
            <div className="w-1/3 flex flex-col gap-4">
                <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl flex-1 flex flex-col shadow-lg">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Info className="text-blue-400" /> Mission Briefing
                    </h2>

                    {!completed ? (
                        <>
                            <div className="flex-1">
                                <p className="text-slate-400 mb-2 text-sm uppercase tracking-wider font-semibold">
                                    Current Target:
                                </p>
                                <p className="text-lg text-white font-medium mb-4">
                                    {currentLevel.prompt}
                                </p>

                                {feedback && (
                                    <div className={clsx(
                                        "p-4 rounded-lg border flex gap-3 animate-in fade-in slide-in-from-bottom-2",
                                        feedback.type === 'success' ? "bg-green-500/10 border-green-500/20 text-green-300" : "bg-red-500/10 border-red-500/20 text-red-300"
                                    )}>
                                        {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                        <p className="text-sm">{feedback.msg}</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-auto">
                                <div className="flex justify-between text-xs text-slate-500 mb-2">
                                    <span>Progress</span>
                                    <span>{levelIndex} / {LEVELS.length}</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-500"
                                        style={{ width: `${(levelIndex / LEVELS.length) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 mb-2">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-white">Analysis Complete!</h3>
                            <p className="text-slate-400">
                                You've successfully identified all critical SAML components. The assertion is valid.
                            </p>
                            <button
                                onClick={() => {
                                    setLevelIndex(0);
                                    setCompleted(false);
                                    setFeedback(null);
                                }}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                            >
                                Restart Simulation
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: XML Viewer */}
            <div className="w-2/3 bg-[#1e1e1e] rounded-xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col font-mono text-sm">
                <div className="bg-[#252526] px-4 py-2 text-xs text-slate-400 border-b border-black flex items-center justify-between">
                    <span>saml_response.xml</span>
                    <span>XML</span>
                </div>
                <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                    {RAW_XML.split('\n').map((line, i) => (
                        <div
                            key={i}
                            onClick={() => handleLineClick(line)}
                            className={clsx(
                                "group flex cursor-pointer hover:bg-[#2a2d2e] rounded px-2 transition-colors duration-150",
                                // Highlight line logic could go here if we wanted to show specific target hints
                            )}
                        >
                            <span className="text-slate-600 select-none w-8 text-right mr-4 opacity-50">{i + 1}</span>
                            <pre className="text-slate-300 group-hover:text-white transition-colors">
                                <span dangerouslySetInnerHTML={{ __html: syntaxHighlight(line) }} />
                            </pre>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Simple syntax highlighter for XML
function syntaxHighlight(xml: string): string {
    return xml
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/(&lt;\/?)([\w:.-]+)(.*?)(&gt;)/g, (match, p1, p2, p3, p4) => {
            // p1: < or </
            // p2: Tag Name
            // p3: Attributes
            // p4: >
            const tagName = `<span class="text-blue-400">${p2}</span>`;
            const attrs = p3.replace(/([\w:.-]+)=/g, '<span class="text-sky-300">$1</span>=')
                .replace(/"(.*?)"/g, '<span class="text-orange-300">"$1"</span>');
            return `<span class="text-gray-400">${p1}</span>${tagName}${attrs}<span class="text-gray-400">${p4}</span>`;
        });
}
