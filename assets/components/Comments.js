import React, { useState, useEffect } from 'react';
import CommentForm from './CommentForm';

const Comments = (props) => {
  const [comments, setComments] = useState([]);
  const [value, setValue] = useState(props.gameId);

  useEffect(() => {
    const intervalId = setInterval(() => {
        let url = '/index.php/comments/'+props.gameId;
    fetch(url) // Replace with the correct API endpoint URL
      .then((response) => response.json())
      .then((data) => setComments(data))
      .catch((error) => console.error("Error fetching data:", error));
    }, 3000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [props.gameId]);

  
  



  const handleCommentSubmit = (comment) => {
    // Implement logic to submit the comment, e.g., send it to a server
    // For now, just update the local state
    
    if (props.registered == "Registration successful") {
        fetch("index.php/comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: props.user,
          gameId: props.gameId,
          message: comment
        }),
    })
    .then((response) => {
      if (response.status === 200) {
        let url = '/index.php/comments/'+props.gameId;
    fetch(url) // Replace with the correct API endpoint URL
      .then((response) => response.json())
      .then((data) => setComments(data))
      .catch((error) => console.error("Error fetching data:", error));
      } else {
        // Handle registration errors, e.g., display error messages
      }
    })
    .catch((error) => {
      // Handle network or other errors
    });
    } else {
    alert("Vous devez être connecté pour laisser un commentaire");
    }
  };

  

  return (
    <div className=" text-white text-center col-10 mx-auto" style={{ borderRadius: "1rem", opacity: 0.8, fontSize: "1.1rem" }}>
    
      {/* Display existing comments */}
      <h2>Commentaires sur ce match</h2>
      {comments.length == 0 && <p className="info">Pas d'avis d'utilisateurs dispos sur ce match</p>}
      <ul>
        {comments.length !== 0 && comments.map((comment, index) => (
          <li key={index} className='bg-dark p-2 m-2 text-left' style={{ borderRadius: "1rem"}}><strong>{comment.user} : </strong>{comment.content}</li>
        ))}
      </ul>

      {/* Render the CommentForm component */}
      <CommentForm onCommentSubmit={handleCommentSubmit} />
    </div>
  );
};

export default Comments;