import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="markdown-content w-full text-inherit">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ ...props }) => (
            <div className="my-3 overflow-x-auto rounded-xl border border-border bg-background shadow-sm">
              <table className="w-full text-xs text-left border-collapse" {...props} />
            </div>
          ),
          thead: ({ ...props }) => <thead className="bg-muted/70 text-foreground font-semibold" {...props} />,
          tbody: ({ ...props }) => <tbody className="divide-y divide-border/60" {...props} />,
          th: ({ ...props }) => <th className="px-3 py-2.5 font-bold border-b border-border text-foreground" {...props} />,
          td: ({ ...props }) => <td className="px-3 py-2.5 text-muted-foreground" {...props} />,
          ul: ({ ...props }) => <ul className="list-disc pl-5 my-2.5 space-y-1 text-sm" {...props} />,
          ol: ({ ...props }) => <ol className="list-decimal pl-5 my-2.5 space-y-1 text-sm" {...props} />,
          li: ({ ...props }) => <li className="leading-relaxed" {...props} />,
          p: ({ ...props }) => <p className="my-2 leading-relaxed" {...props} />,
          strong: ({ ...props }) => <strong className="font-bold text-foreground" {...props} />,
          a: ({ ...props }) => <a className="text-primary underline hover:text-primary/80 font-medium" target="_blank" rel="noopener noreferrer" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
