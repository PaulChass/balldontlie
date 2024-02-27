import React, { useState, useEffect } from 'react';
import CommentForm from './CommentForm';

const Comments = (props) => {
  const [comments, setComments] = useState([]);
  const [value, setValue] = useState(props.gameId);
  const [randomId,setRandomId] = useState(Math.floor(Math.random() * 100) + 1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    let url = '/index.php/comments/'+props.gameId;
    fetch(url) // Replace with the correct API endpoint URL
      .then((response) => response.json())
      .then((data) => setComments(data))
      .then(()=>setIsLoading(false))
      .catch((error) => console.error("Error fetching data:", error));
    const intervalId = setInterval(() => {
        let url = '/index.php/comments/'+props.gameId;
    fetch(url) // Replace with the correct API endpoint URL
      .then((response) => response.json())
      .then((data) => setComments(data))
      .then(()=>setIsLoading(false))
      .catch((error) => console.error("Error fetching data:", error));
    }, 3000);
    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [props.gameId]);

  
  console.log(isLoading);



  const handleCommentSubmit = (comment) => {
    // Implement logic to submit the comment, e.g., send it to a server
    // For now, just update the local state
    

        fetch("index.php/comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: props.user,
          gameId: props.gameId,
          message: comment,
          randomId : randomId
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
    
  };

  

  return (
    <div className=" text-white text-center col-10 mx-auto" style={{ opacity: 0.8, fontSize: "1.1rem" }}>
    
      {/* Display existing comments */}
      <h2>Commentaires sur ce match</h2>
      {isLoading && <i class="text-white fa fa-spinner fa-spin" style={{fontSize:"2rem"}}></i>}
      {isLoading == false  && comments.length == 0 && <p className="info">Pas d'avis d'utilisateurs dispos sur ce match</p>}
      <ul>
        {comments.length !== 0 && isLoading==false && comments.map((comment, index) => (
          <li key={index} className='bg-dark p-3 m-2 text-left' style={{ borderRadius: "1rem"}}><strong>
            { comment.user }
            </strong>: {comment.content}
            </li>
        ))}
      </ul>

      {/* Render the CommentForm component */}
      <CommentForm onCommentSubmit={handleCommentSubmit} />
    </div>
  );
};

export default Comments;