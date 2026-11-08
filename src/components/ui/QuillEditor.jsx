import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const QuillEditor = forwardRef(({ value, onChange, placeholder }, ref) => {
  const editorRef = useRef(null);
  const quillInstance = useRef(null);

  useImperativeHandle(ref, () => ({
    getEditor: () => quillInstance.current,
  }));

  useEffect(() => {
    if (!editorRef.current) return;

    const toolbarOptions = [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ align: [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean'],
      [{ font: [] }],
      [{ size: ['small', false, 'large', 'huge'] }],
      [{ script: 'sub' }, { script: 'super' }],
    ];

    quillInstance.current = new Quill(editorRef.current, {
      theme: 'snow',
      modules: { toolbar: toolbarOptions },
      placeholder: placeholder || 'Enter note...',
    });

    if (value) {
      quillInstance.current.root.innerHTML = value;
    }

    quillInstance.current.on('text-change', () => {
      const html = quillInstance.current.root.innerHTML;
      onChange(html);
    });

    return () => {
      if (quillInstance.current) {
        quillInstance.current.off('text-change');
      }
    };
  }, []);

  useEffect(() => {
    if (quillInstance.current && quillInstance.current.root.innerHTML !== value) {
      quillInstance.current.root.innerHTML = value || '';
    }
  }, [value]);

  return (
    <div className="compact-quill-wrapper">
      <div ref={editorRef} className="compact-quill-editor" />
      <style>{`
        .compact-quill-wrapper .ql-toolbar {
          padding: 4px 8px !important;
          min-height: 36px !important;
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
        }
        .compact-quill-wrapper .ql-toolbar button {
          width: 24px !important;
          height: 24px !important;
          padding: 2px !important;
        }
        .compact-quill-wrapper .ql-toolbar .ql-picker {
          font-size: 12px !important;
        }
        .compact-quill-wrapper .ql-container {
          min-height: 100px !important;
          max-height: 280px !important;
          overflow-y: auto !important;
          font-size: 13px !important;
          border-bottom-left-radius: 0.375rem;
          border-bottom-right-radius: 0.375rem;
        }
        .compact-quill-wrapper .ql-editor {
          padding: 8px !important;
          line-height: 1.4 !important;
        }
        .compact-quill-wrapper .ql-editor.ql-blank::before {
          font-size: 13px !important;
          font-style: normal !important;
          color: #9ca3af !important;
        }
        .compact-quill-wrapper .ql-toolbar .ql-formats {
          margin-right: 6px !important;
        }
        .compact-quill-wrapper .ql-toolbar .ql-formats:last-child {
          margin-right: 0;
        }
      `}</style>
    </div>
  );
});

export default QuillEditor;