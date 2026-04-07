const getPreviewUrl = (rawUrl = '', label = '') => {
  const lower = `${rawUrl} ${label}`.toLowerCase();
  const encoded = encodeURIComponent(rawUrl);
  const isCloudinary = rawUrl.includes('res.cloudinary.com');
  const isPpt = lower.includes('.ppt') || lower.includes('.pptx');
  const isPdf = lower.includes('.pdf');
  const isDoc = lower.includes('.doc') || lower.includes('.docx');

  if (isPpt) return `https://view.officeapps.live.com/op/embed.aspx?src=${encoded}`;
  if (isPdf && isCloudinary) return rawUrl;
  if (isDoc) return `https://docs.google.com/gview?embedded=1&url=${encoded}`;
  if (isPdf) return rawUrl;
  return rawUrl;
};

const FilePreviewModal = ({ open, title, fileUrl, onClose }) => {
  if (!open || !fileUrl) return null;
  const previewUrl = getPreviewUrl(fileUrl, title);

  return (
    <div className="file-preview-backdrop" onClick={onClose} role="presentation">
      <div className="file-preview-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="file-preview-header">
          <h3>{title}</h3>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
        <iframe title={title} src={previewUrl} className="file-preview-frame" />
        <div className="file-preview-footer">
          If preview fails, <a href={fileUrl} target="_blank" rel="noreferrer">open file</a>.
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
