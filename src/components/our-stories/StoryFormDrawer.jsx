import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild, Combobox, ComboboxInput, ComboboxButton, ComboboxOptions, ComboboxOption } from '@headlessui/react';
import { Fragment, useState, useEffect, useMemo, useRef } from 'react';
import { X, Save, Loader2, Image as ImageIcon, Plus, Trash2, UploadCloud, FileText, Settings, Code, ChevronsUpDown, Check, Link, Unlink, RotateCcw } from 'lucide-react';
import { fetchClient } from '@/api/fetchClient';
import toast from 'react-hot-toast';
import JoditEditor from 'jodit-react';

// --- Subcomponent for FAQ Items to prevent Jodit cursor jumps ---
const FaqItem = ({ faq, idx, removeFaq, updateFaq, minimalJoditConfig }) => {
  // We only pass the initial answer to Jodit so it doesn't reset when parent re-renders!
  const [initialAnswer] = useState(faq.answer || '');
  
  return (
    <div className="bg-transparent border border-gray-200 p-4 rounded-lg relative group">
      <button onClick={() => removeFaq(idx)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 bg-white rounded shadow-sm p-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Trash2 size={14} />
      </button>
      <div className="space-y-3 pr-8">
        <input 
          type="text" 
          value={faq.question} 
          onChange={e => updateFaq(idx, 'question', e.target.value)} 
          placeholder="Question..." 
          className="w-full font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:border-primary focus:outline-none pb-1" 
        />
        <div className="mt-2 bg-white rounded-lg overflow-hidden border border-gray-200">
          <JoditEditor
            value={initialAnswer}
            config={minimalJoditConfig}
            onBlur={newContent => updateFaq(idx, 'answer', newContent)}
            onChange={() => {}} 
          />
        </div>
      </div>
    </div>
  );
};

export default function StoryFormDrawer({ isOpen, onClose, blog, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic'); // 'basic', 'content', 'seo'
  const [existingCategories, setExistingCategories] = useState([]);
  const [query, setQuery] = useState('');
  const [imageFile, setImageFile] = useState(null);

  const filteredCategories = query === '' 
    ? existingCategories 
    : existingCategories.filter((cat) => cat.toLowerCase().includes(query.toLowerCase()));

  // Jodit config
  const editorRef = useRef(null);
  const joditConfig = useMemo(() => ({
    readonly: false,
    placeholder: 'Start writing your blog...',
    height: 500,
    enableDragAndDropFileToEditor: true,
    uploader: { insertImageAsBase64URI: true }, // Simple base64 for inline images
    toolbarAdaptive: false, // dYOY FIX: Prevents toolbar buttons from vanishing when resizing/toggling code view!
    showTooltip: true,
    
    useNativeTooltip: true, // Native browser tooltips are fully reliable for hover
    buttons: [
      'bold', 'italic', 'underline', 'strikethrough', 'eraser', '|',
      'ul', 'ol', '|',
      'font', 'fontsize', 'paragraph', 'classSpan', '|',
      'superscript', 'subscript', 'brush', '|',
      'file', 'image', 'video', '\n',
      
      'spellcheck', 'speechRecognize', '|',
      'cut', 'copy', 'paste', 'selectall', 'copyformat', '|',
      'hr', 'table', 'link', 'symbol', '|',
      'align', 'undo', 'redo', '|',
      'find', 'source', 'fullsize', 'preview', 'print'
    ]
  }), []);

  const minimalJoditConfig = useMemo(() => ({
    readonly: false,
    placeholder: 'Answer (supports formatting & links)...',
    height: 90,
    toolbarAdaptive: false,
    useNativeTooltip: true,
    buttons: [
      'bold', 'italic', 'underline', 'strikethrough', 'eraser', '|',
      'ul', 'ol', '|',
      'superscript', 'subscript', 'brush', '|',
      'align', 'undo', 'redo', '|',
      'link', 'source', 'fullsize'
    ]
  }), []);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    coverImageAlt: '',
    category: '',
    customAuthor: '',
    isPublished: true,
    faqs: [],
    seoMetaTitle: '',
    seoMetaDescription: '',
    seoMetaKeywords: '',
    seoCanonicalUrl: '',
    seoIsNoIndex: false,
    seoJsonLdSchema: ''
  });

  useEffect(() => {
    // Fetch categories for the creatable select
    fetchClient('/our-stories/categories').then(res => {
      if (res.data?.categories) {
        setExistingCategories(res.data.categories);
      }
    }).catch(console.error);
  }, []);

  const handleCategorySelect = async (catName) => {
    setFormData(prev => ({ ...prev, category: catName }));
    if (!catName || formData.excerpt) return;
    try {
      const res = await fetchClient('/our-stories');
      if (res.data?.blogs) {
        const matchingBlog = res.data.blogs.find(b => b.category === catName && b.excerpt);
        if (matchingBlog) {
          setFormData(prev => ({ ...prev, excerpt: matchingBlog.excerpt }));
          toast.success(`Loaded previous excerpt for "${catName}"`);
        }
      }
    } catch(e) {}
  };

  const [touchedFields, setTouchedFields] = useState({ seoMetaTitle: false, seoMetaDescription: false, seoJsonLdSchema: false });
  const [editorContent, setEditorContent] = useState('');

  useEffect(() => {
    if (blog && isOpen) {
      setFormData({
        title: blog.title || '',
        slug: blog.slug || '',
        excerpt: blog.excerpt || '',
        content: blog.content || '',
        coverImage: blog.coverImage || '',
        coverImageAlt: blog.coverImageAlt || '',
        category: blog.category || '',
        customAuthor: blog.customAuthor || '',
        isPublished: blog.isPublished ?? true,
        faqs: blog.faqs || [],
        seoMetaTitle: blog.seoMetaTitle || '',
        seoMetaDescription: blog.seoMetaDescription || '',
        seoMetaKeywords: blog.seoMetaKeywords || '',
        seoCanonicalUrl: blog.seoCanonicalUrl || '',
        seoIsNoIndex: blog.seoIsNoIndex ?? false,
        seoJsonLdSchema: blog.seoJsonLdSchema || ''
      });
      setTouchedFields({
        seoMetaTitle: !!blog.seoMetaTitle,
        seoMetaDescription: !!blog.seoMetaDescription,
        seoJsonLdSchema: !!blog.seoJsonLdSchema
      });
      setEditorContent(blog.content || '');
      setActiveTab('basic');
    } else if (!blog && isOpen) {
      // Reset
      setFormData({
        title: '', slug: '', excerpt: '', content: '', coverImage: '', coverImageAlt: '', category: '', customAuthor: '',
        isPublished: true, faqs: [], seoMetaTitle: '', seoMetaDescription: '', 
        seoMetaKeywords: '', seoCanonicalUrl: '', seoIsNoIndex: false, seoJsonLdSchema: ''
      });
      setTouchedFields({ seoMetaTitle: false, seoMetaDescription: false, seoJsonLdSchema: false });
      setEditorContent('');
      setImageFile(null);
      setActiveTab('basic');
    }
  }, [blog, isOpen]);

  // Automated SEO Engine
  useEffect(() => {
    setFormData(prev => {
      let updated = { ...prev };
      let changed = false;

      // 1. Meta Title
      if (!touchedFields.seoMetaTitle && prev.title !== prev.seoMetaTitle) {
        updated.seoMetaTitle = prev.title;
        changed = true;
      }

      // 2. Meta Description
      if (!touchedFields.seoMetaDescription) {
        const strippedText = prev.content.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
        const excerpt = strippedText.length > 180 ? strippedText.substring(0, 180) + '...' : strippedText;
        if (excerpt && excerpt !== prev.seoMetaDescription) {
          updated.seoMetaDescription = excerpt;
          changed = true;
        }
      }

      // 3. JSON-LD Schema
      if (!touchedFields.seoJsonLdSchema) {
        const authorName = prev.customAuthor || "Admin";
        
        const currentMetaDesc = updated.seoMetaDescription !== undefined ? updated.seoMetaDescription : prev.seoMetaDescription;
        const currentMetaTitle = updated.seoMetaTitle !== undefined ? updated.seoMetaTitle : prev.seoMetaTitle;

        const datePublished = (blog?.createdAt ? new Date(blog.createdAt) : new Date()).toISOString().split('T')[0];
        const dateModified = new Date().toISOString().split('T')[0];

        const schemaObj = {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": currentMetaTitle || prev.title,
          "image": prev.coverImage ? [prev.coverImage] : [],
          "author": {
            "@type": "Person",
            "name": authorName
          },
          "publisher": {
            "@type": "Organization",
            "name": "Ruh Musafir",
            "logo": {
              "@type": "ImageObject",
              "url": "https://ruhmusafir.com/logo.png"
            }
          },
          "datePublished": datePublished,
          "dateModified": dateModified,
          "description": currentMetaDesc || "",
          "url": prev.seoCanonicalUrl || `https://ruhmusafir.com/our-stories/${prev.slug || ''}`,
          "mainEntityOfPage": `https://ruhmusafir.com/our-stories/${prev.slug || ''}`
        };

        const newSchemaStr = JSON.stringify(schemaObj, null, 2);
        if (newSchemaStr !== prev.seoJsonLdSchema) {
          updated.seoJsonLdSchema = newSchemaStr;
          changed = true;
        }
      }

      return changed ? updated : prev;
    });
  }, [formData.title, formData.content, formData.coverImage, formData.slug, formData.customAuthor, formData.seoCanonicalUrl, formData.seoMetaTitle, formData.seoMetaDescription, touchedFields, blog]);

  // Local File Upload Handler
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return toast.error("File is too large (max 5MB)");
      }
      setImageFile(file);
      setFormData(prev => ({ ...prev, coverImage: URL.createObjectURL(file) }));
    }
  };

  const handleDeleteImage = () => {
    setImageFile(null);
    setFormData(prev => ({ ...prev, coverImage: '' }));
  };

  const handleSave = async () => {
    if (!formData.title || !formData.slug) return toast.error("Title and Slug are required");
    
    setIsLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'faqs') {
          data.append('faqs', JSON.stringify(formData.faqs));
        } else if (key === 'coverImage' && imageFile) {
          // handled below
        } else {
          data.append(key, formData[key] === null ? '' : formData[key]);
        }
      });
      
      if (imageFile) {
        data.append('coverImage', imageFile);
      } else if (!formData.coverImage) {
        data.append('coverImage', 'null'); // Indicate deletion to backend if no local file but existing removed
      }

      if (blog?.id) {
        await fetchClient(`/our-stories/${blog.id}`, { method: 'PATCH', body: data });
        toast.success("Blog updated!");
      } else {
        await fetchClient('/our-stories', { method: 'POST', body: data });
        toast.success("Blog created!");
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message || "Failed to save blog");
    } finally {
      setIsLoading(false);
    }
  };

  const autoGenerateSlug = (title) => {
    if (blog?.id) return; // Don't auto-change slug on edit unless they wipe it
    const newSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setFormData(prev => ({ ...prev, slug: newSlug }));
  };

  const addFaq = () => setFormData(prev => ({ ...prev, faqs: [...prev.faqs, { _id: Date.now().toString(), question: '', answer: '' }] }));
  const removeFaq = (idx) => setFormData(prev => ({ ...prev, faqs: prev.faqs.filter((_, i) => i !== idx) }));
  const updateFaq = (idx, field, val) => {
    const newFaqs = [...formData.faqs];
    newFaqs[idx][field] = val;
    setFormData(prev => ({ ...prev, faqs: newFaqs }));
  };

  return (
    <>
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => { /* Prevent outside click from closing to protect dropdowns and data */ }}>
        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-end p-0">
            <TransitionChild as={Fragment} enter="transform transition ease-in-out duration-300 sm:duration-500" enterFrom="translate-x-full" enterTo="translate-x-0" leave="transform transition ease-in-out duration-300 sm:duration-500" leaveFrom="translate-x-0" leaveTo="translate-x-full">
              <DialogPanel className="w-full max-w-5xl transform overflow-hidden bg-white/90 backdrop-blur-3xl border-l border-white/20 h-screen shadow-2xl flex flex-col">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/50 bg-white/40">
                  <DialogTitle as="h3" className="text-lg font-bold text-gray-900">
                    {blog ? 'Edit Blog Post' : 'Create New Blog'}
                  </DialogTitle>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-500 bg-white rounded-full p-2 shadow-sm border border-gray-100">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200/50 px-6 bg-white/40">
                  <button onClick={() => setActiveTab('basic')} className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'basic' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    <FileText className="w-4 h-4" /> Basics
                  </button>
                  <button onClick={() => setActiveTab('content')} className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'content' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    <Code className="w-4 h-4" /> Content Editor
                  </button>
                  <button onClick={() => setActiveTab('seo')} className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'seo' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    <Settings className="w-4 h-4" /> SEO Data
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-transparent">
                  
                  {activeTab === 'basic' && (
                    <div className="space-y-6 max-w-6xl">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">Title <span className="text-red-500">*</span></label>
                        <input type="text" value={formData.title} onChange={e => { setFormData({...formData, title: e.target.value}); autoGenerateSlug(e.target.value); }} className="w-full p-2 bg-white/70 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="Fell the luxury near Mountains..." />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">URL Slug <span className="text-red-500">*</span></label>
                        <div className="flex items-center">
                          <span className="bg-gray-100 border border-gray-200 border-r-0 rounded-l-lg px-3 py-2.5 text-gray-500 text-sm">/blog/</span>
                          <input type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="flex-1 p-2 border border-gray-200 rounded-r-lg" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">Category</label>
                        <Combobox value={formData.category} onChange={handleCategorySelect}>
                          <div className="relative mt-1">
                            <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-gray-200 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
                              <ComboboxInput
                                className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 outline-none"
                                displayValue={(cat) => cat}
                                onChange={(event) => setQuery(event.target.value)}
                                onBlur={(event) => {
                                  if (!formData.category && event.target.value) {
                                    handleCategorySelect(event.target.value);
                                  }
                                }}
                                placeholder="Select or type to create a new category..."
                              />
                              <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
                                <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                              </ComboboxButton>
                            </div>
                            <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0" afterLeave={() => setQuery('')}>
                              <ComboboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-50">
                                {query.length > 0 && !filteredCategories.includes(query) && (
                                  <ComboboxOption value={query} className="relative cursor-default select-none py-2 pl-10 pr-4 text-gray-900 hover:bg-primary/10">
                                    Create "{query}"
                                  </ComboboxOption>
                                )}
                                {filteredCategories.map((cat) => (
                                  <ComboboxOption key={cat} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-primary/10 text-primary' : 'text-gray-900'}`} value={cat}>
                                    {({ selected, active }) => (
                                      <>
                                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{cat}</span>
                                        {selected ? (
                                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                                            <Check className="h-5 w-5" aria-hidden="true" />
                                          </span>
                                        ) : null}
                                      </>
                                    )}
                                  </ComboboxOption>
                                ))}
                              </ComboboxOptions>
                            </Transition>
                          </div>
                        </Combobox>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">Custom Author Name (Optional)</label>
                          <input 
                            type="text" 
                            value={formData.customAuthor} 
                            onChange={(e) => setFormData({...formData, customAuthor: e.target.value})}
                            className="w-full p-2 bg-white/70 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            placeholder="E.g. Guest Post by Jane Doe"
                          />
                        <p className="text-xs text-gray-500 mt-1">Leave empty to use your admin profile name.</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">Short Excerpt</label>
                        <textarea value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value})} className="w-full p-2 bg-white/70 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all h-20" placeholder="Brief summary for blog cards..." />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Featured Image</label>
                        {formData.coverImage ? (
                          <div className='flex flex-row space-x-5 items-start'>
                            <div className="relative rounded-xl overflow-hidden border border-gray-200 w-full max-w-sm mb-3">
                              <img src={formData.coverImage.startsWith('blob:') || formData.coverImage.startsWith('http') ? formData.coverImage : `${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1').replace('/api/v1', '')}${formData.coverImage}`} alt="Cover Preview" className="w-full h-48 object-cover" />
                              <button onClick={handleDeleteImage} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 shadow-md transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="w-full max-w-sm">
                              <label className="block text-xs font-bold text-gray-700 mb-1">Image Alt Text (SEO)</label>
                              <input 
                                type="text" 
                                value={formData.coverImageAlt || ''} 
                                onChange={e => setFormData({...formData, coverImageAlt: e.target.value})} 
                                className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none" 
                                placeholder="Describe the image for Google..." 
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="relative flex flex-col items-center justify-center w-full max-w-sm h-32 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-100 hover:border-primary transition-colors text-gray-500 group">
                            <UploadCloud className="w-8 h-8 mb-2 group-hover:text-primary transition-colors" />
                            <span className="text-sm font-medium">Upload Cover Image</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleFileChange}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-200">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={formData.isPublished} onChange={e => setFormData({...formData, isPublished: e.target.checked})} className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          <span className="ml-3 text-sm font-bold text-gray-900">Publish Immediately?</span>
                        </label>
                        <p className="text-xs text-gray-500 ml-auto">If unchecked, it saves as a Draft.</p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'content' && (
                    <div className="space-y-8 max-w-6xl mx-auto">
                      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gray-900 px-4 py-2 flex items-center justify-between">
                          <span className="text-xs font-bold text-white uppercase tracking-wider">Rich Text Editor</span>
                          <span className="text-xs text-gray-400">Supports Markdown Paste</span>
                        </div>
                        <JoditEditor
                          ref={editorRef}
                          value={editorContent}
                          config={joditConfig}
                          onBlur={newContent => {
                            setFormData({...formData, content: newContent});
                            setEditorContent(newContent);
                          }}
                          onChange={() => {}} // Empty onChange to satisfy prop requirements without triggering cursor jump
                        />
                      </div>

                      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-4">
                          <h4 className="font-bold text-gray-900">Dynamic FAQs</h4>
                          <button onClick={addFaq} className="text-xs font-bold text-primary flex items-center gap-1 hover:text-primary-dark bg-primary/10 px-3 py-1.5 rounded-lg">
                            <Plus size={14} /> Add Question
                          </button>
                        </div>
                        {formData.faqs.length === 0 ? (
                          <p className="text-sm text-gray-400 italic text-center py-4">No FAQs added yet.</p>
                        ) : (
                          <div className="space-y-4">
                            {formData.faqs.map((faq, idx) => (
                              <FaqItem 
                                key={faq._id || idx} 
                                faq={faq} 
                                idx={idx} 
                                removeFaq={removeFaq} 
                                updateFaq={updateFaq} 
                                minimalJoditConfig={minimalJoditConfig} 
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'seo' && (
                    <div className="space-y-6 max-w-6xl">
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                        <h4 className="text-sm font-bold text-blue-900 mb-1">Automated SEO Engine</h4>
                        <p className="text-xs text-blue-700">If you leave and SEO data blank, the system will automatically generate a highly optimized SEO metadata using your title, excerpt, cover image, and author name. Along with `Article` schema.</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-sm font-semibold text-gray-900">Meta Title</label>
                          <div className="flex items-center gap-2">
                            {touchedFields.seoMetaTitle ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                <Unlink className="w-3 h-3" /> Manual Override
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                <Link className="w-3 h-3" /> Auto Syncing
                              </span>
                            )}
                            {touchedFields.seoMetaTitle && (
                              <button onClick={() => setTouchedFields(prev => ({...prev, seoMetaTitle: false}))} className="text-[10px] flex items-center gap-1 font-semibold text-primary hover:text-primary-dark transition-colors">
                                <RotateCcw className="w-3 h-3" /> Reset
                              </button>
                            )}
                          </div>
                        </div>
                        <input type="text" value={formData.seoMetaTitle} onChange={e => { setFormData({...formData, seoMetaTitle: e.target.value}); if (!touchedFields.seoMetaTitle) setTouchedFields(prev => ({...prev, seoMetaTitle: true})); }} className="w-full p-2 bg-white/70 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="Defaults to Blog Title" />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-sm font-semibold text-gray-900">Meta Description</label>
                          <div className="flex items-center gap-2">
                            {touchedFields.seoMetaDescription ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                <Unlink className="w-3 h-3" /> Manual Override
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                <Link className="w-3 h-3" /> Auto Syncing
                              </span>
                            )}
                            {touchedFields.seoMetaDescription && (
                              <button onClick={() => setTouchedFields(prev => ({...prev, seoMetaDescription: false}))} className="text-[10px] flex items-center gap-1 font-semibold text-primary hover:text-primary-dark transition-colors">
                                <RotateCcw className="w-3 h-3" /> Reset
                              </button>
                            )}
                          </div>
                        </div>
                        <textarea value={formData.seoMetaDescription} onChange={e => { setFormData({...formData, seoMetaDescription: e.target.value}); if (!touchedFields.seoMetaDescription) setTouchedFields(prev => ({...prev, seoMetaDescription: true})); }} className="w-full p-2 bg-white/70 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all h-24" placeholder="Defaults to Excerpt" />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">Target Keywords</label>
                        <input type="text" value={formData.seoMetaKeywords} onChange={e => setFormData({...formData, seoMetaKeywords: e.target.value})} className="w-full p-2 bg-white/70 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="moving tips, packing, boxes..." />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">Canonical URL</label>
                        <input type="text" value={formData.seoCanonicalUrl} onChange={e => setFormData({...formData, seoCanonicalUrl: e.target.value})} className="w-full p-2 bg-white/70 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder={`https://ruhmusafir.com/our-stories/${formData.slug || 'slug'}`} />
                        <p className="text-xs text-gray-500 mt-1">Leave empty to use the default URL. Only set this if this blog was originally published somewhere else.</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-sm font-semibold text-gray-900">Custom JSON-LD Schema (Optional)</label>
                          <div className="flex items-center gap-2">
                            {touchedFields.seoJsonLdSchema ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                <Unlink className="w-3 h-3" /> Manual Override
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                <Link className="w-3 h-3" /> Auto Syncing
                              </span>
                            )}
                            {touchedFields.seoJsonLdSchema && (
                              <button onClick={() => setTouchedFields(prev => ({...prev, seoJsonLdSchema: false}))} className="text-[10px] flex items-center gap-1 font-semibold text-primary hover:text-primary-dark transition-colors">
                                <RotateCcw className="w-3 h-3" /> Reset
                              </button>
                            )}
                          </div>
                        </div>
                        <textarea value={formData.seoJsonLdSchema} onChange={e => { setFormData({...formData, seoJsonLdSchema: e.target.value}); if (!touchedFields.seoJsonLdSchema) setTouchedFields(prev => ({...prev, seoJsonLdSchema: true})); }} className="w-full p-2 border border-gray-200 rounded-lg font-mono text-xs h-40 bg-gray-900 text-green-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder='{ "@context": "https://schema.org"... }' />
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={formData.seoIsNoIndex} onChange={e => setFormData({...formData, seoIsNoIndex: e.target.checked})} className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                          <span className="ml-3 text-sm font-bold text-gray-900">NoIndex (Hide from Google)</span>
                        </label>
                      </div>
                    </div>
                  )}

                </div>

                {/* Footer Footer */}
                <div className="p-4 border-t border-gray-200/50 bg-white/60 flex justify-end gap-3 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] backdrop-blur-md">
                  <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={isLoading} className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-xl transition-colors shadow-lg shadow-primary/30 disabled:opacity-50">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {blog ? 'Update Blog' : 'Publish Blog'}
                  </button>
                </div>

              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
    </>
  );
}
