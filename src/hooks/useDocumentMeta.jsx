import { useEffect } from 'react';

export default function useDocumentMeta(title, description) {
  useEffect(() => {
    // 1. Update the Tab Title
    document.title = title;

    // 2. Update the Meta Description
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = "description";
        document.head.appendChild(metaDescription);
      }
      metaDescription.content = description;
    }
  }, [title, description]); // Re-run if they change
}