import React, { useState } from 'react';

const CommentForm = ({ onCommentSubmit }) => {
  const [comment, setComment] = useState('');

  const handleCommentChange = (e) => {
    setComment(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (comment.trim() !== '') {
      onCommentSubmit(comment);
      setComment('');
    }
  };

  return (
    <div>
      <h3>Et toi t'en penses quoi?</h3>
      <form onSubmit={handleSubmit}>
        <textarea
          rows="4"
          cols="50"
          placeholder="Ton commentaire...."
          value={comment}
          onChange={handleCommentChange}
        ></textarea>
        <br />
        <button type="submit">Envoyer le commentaire</button>
      </form>
    </div>
  );
};

export default CommentForm;