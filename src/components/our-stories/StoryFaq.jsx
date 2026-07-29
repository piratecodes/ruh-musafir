'use client';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';

export default function StoryFaq({ faqs }) {
  if (!faqs || faqs.length === 0) return null;

  return (
    <div className="mt-16 pt-12 border-t border-primary/10">
      <h3 className="text-2xl font-bold text-primary mb-8">Frequently Asked Questions</h3>
      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <Disclosure as="div" defaultOpen={idx === 0} key={idx} className="bg-white/5 backdrop-blur-md border border-primary/10 rounded-2xl transition-all shadow-sm">
            {({ open }) => (
              <>
                <DisclosureButton className="flex w-full items-center justify-between font-bold text-primary p-5 cursor-pointer rounded-2xl hover:bg-secondary/10 focus:outline-none focus-visible:ring focus-visible:ring-primary/50 text-left">
                  <span>{faq.question}</span>
                  <span className={`${open ? 'rotate-180 transform' : ''} transition-transform duration-200 shrink-0 ml-4`}>
                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </DisclosureButton>
                <DisclosurePanel className="text-foreground/70 px-5 pb-5 leading-relaxed prose prose-blue max-w-none prose-a:text-secondary hover:prose-a:opacity-80">
                  <div dangerouslySetInnerHTML={{ __html: faq.answer }} />
                </DisclosurePanel>
              </>
            )}
          </Disclosure>
        ))}
      </div>
    </div>
  );
}
