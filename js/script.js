$(document).ready(function(){
  // Initialize Firebase
  const config = {
    apiKey: "AIzaSyBJC4-KzfrssEXc1lJPuq_N7ORzgH0lDPo",
    authDomain: "javascript-quizzes.firebaseapp.com",
    databaseURL: "https://javascript-quizzes.firebaseio.com",
    projectId: "javascript-quizzes",
    storageBucket: "javascript-quizzes.appspot.com",
    messagingSenderId: "1067729551526"
  };
  firebase.initializeApp(config);

  const
    $quiz = $('#quiz');
    $btnCheck = $('#btn-check'),
    $btnNext = $('#btn-next'),
    $title = $('<a class="navbar-brand" href="index.html"></a>'),
    $explanation = $('<div id="explanation"></div>'),
    $question = $('<h2 id="question" class="py-3"></h2>'),
    $pager = $('<span id="pager" class="font-weight-light navbar-text"></span>'),
    $choices = $('<div id="choice-block"></div>');
    results = {result: []}

  let
    currentQuestion = 0,
    scores = [],
    url = 'data/quiz.json',
    selection,
    questions,
    title,
    correctReplies,
    incorrectReplies,
    user;

  function init(){
    //add title
    let quizTitle = typeof title !== 'undefined' ? title : 'Quiz';

    signIn();

    $title.text(quizTitle).prependTo('header');

    if(typeof questions !== 'undefined' && $.type(questions) === 'array'){

      $pager.appendTo('header');
      $question.appendTo('#quiz');
      $explanation.appendTo('#quiz');
      $choices.appendTo('#quiz');

      setupQuestion(currentQuestion);
    }
  }

  function signIn() {
    firebase.auth().signOut();
    firebase.auth().signInAnonymously().then(function(val){
      user = firebase.auth().currentUser;
      results.uid = user.uid;
    }).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log(errorCode, errorMessage);
    });
  }

  // Sets up question and calls addChoices and setupButton.
  // @param {number} index - Current question index

  function setupQuestion(index){

    $explanation.empty();

    $question.html(questions[index].question);

    $pager.html(`<span class="d-none d-sm-inline">Question </span>${index + 1} of ${questions.length}`);

    addChoices(questions[index].choices, questions[index].format);
    setupButtons();

    $quiz.fadeIn();
  }

  // Adds and formats the choices for multiple-choice questions.
  // @param {array} choices - Array of answer choices
  // @param {format} string - Values are 'text' or 'code'

  function addChoices(choices, format){
    if(typeof choices !== 'undefined' && $.type(choices) == 'array') {
      $choices.empty();
      if(format === 'text') {
        for(let i=0; i<choices.length; i++){
          $(`<div class="choice" data-index="${i}"></div>`).html(`<p class="m-0 p-3 border border-dark bg-light">${choices[i]}</p>`).appendTo('#choice-block');
        }
      }
      if(format === 'code') {
        for(let i=0;i<choices.length; i++){
          $(`<div class="choice" data-index="${i}"></div>`).html(`<pre><code>${choices[i]}</code></pre>`).appendTo('#choice-block');
        }
        $('pre code').each(function(i, block) {
          hljs.highlightBlock(block);
        });
      }
    }
  }

  // Disables the Next button, sets up the event listener
  // for the choices and event listnert to enable the
  // Check Answer button after a selection is made.

  function setupButtons(){
    $btnNext.attr('disabled',true);
    $('.choice').on('click', function(){
      $('.choice').removeClass('selected');
      $(this).addClass('selected');
      selection = $(this).data('index');
      $btnCheck.removeAttr('disabled')
        .off()
        .one('click', function(){
          $('.choice').off('click');
          $(this).attr('disabled',true);
          $btnNext.removeAttr('disabled');
          checkAnswer(selection);
      });
    });
  }

  function emptyScreen() {
    $quiz.fadeOut('slow');
  }

  // Checks if the submitted choice is the correct answer
  // and updates the UI to display the results.
  // @param {number} choice - Index of the selected choice

  function checkAnswer(choice){
    const correctAnswer = questions[currentQuestion]['answer'];
    const answeredCorrect = choice === correctAnswer ? 1 : 0;
    const reply = randomReply(answeredCorrect);
    const classValue = answeredCorrect ? 'text-success' : 'text-danger';

    scores.push(answeredCorrect);

    recordResults(choice, answeredCorrect);

    $explanation.html(`<h3></h3><p>${questions[currentQuestion]['explanation']}</p>`).hide();

    $choices.children('.choice').each(function(i){
      if (i === correctAnswer) {
        $(this).removeClass('selected').addClass('correct');
      } else if ($(this).hasClass('selected') && i !== correctAnswer) {
        $(this).removeClass('selected').addClass('incorrect');
      }
    });

    $explanation.find('h3').addClass(classValue).text(reply);

    $explanation.slideDown();

    currentQuestion++;

    transitionButtons();
  }

  // Returns a random reply from the array of options
  // depending on whether answered correctly or incorrectly.
  // @param {boolean} answer - True if answered correctly

  function randomReply(answer){
    let replyArray = answer ? correctReplies : incorrectReplies;
    let reply = replyArray[Math.floor(Math.random()*replyArray.length)];
    return reply;
  }

  function recordResults(choice, answeredCorrect){
    const resultObj = {
      answered: choice,
      correct: answeredCorrect
    }

    results.result.push(resultObj);
  }

    function transitionButtons() {
    if (currentQuestion === questions.length) {

      $btnNext.text('Show My Score');
      $btnCheck.hide();
      $btnNext.one('click', function(){
        emptyScreen();

        setTimeout(function(){
          endQuiz();
        }, 500);
      });

    } else {

      $btnNext.one('click', function(){
        emptyScreen();

        setTimeout(function(){
          setupQuestion(currentQuestion);
        }, 500);

      });

    }
  }

  // Quiz ends, display a message.

  function endQuiz(){
    let list = '';
    let score = scores.reduce((a, b) => a + b, 0);
    let grade = Math.round(score/questions.length * 100) + '%';
    let result =`
      <h3>You scored ${grade}</h3>
      <p>${score} of ${questions.length} correct</p>
      <h4>Summary</h4>
      <ol></ol>
     `;

    results.score = score;

    $.each(scores, function(i, value){
      let correct = scores[i];
      let code = questions[i]['format'] == 'code' ? 1 : 0;

      list += `
        <li class="my-3">
          <span class="result ${correct ? 'text-success' : 'text-danger'}">${correct ? 'correct' : 'incorrect'}.</span>
          <br><strong>Q.</strong> ${questions[i]['question']}
          <br><strong>A.</strong> ${code ? '<code>' : ''}${questions[i]['choices'][questions[i]['answer']]}${code ? '</code>' : ''}
        </li>`

    });
    $('#buttons').hide();
    $quiz.html(result).find('ol').html(list);

    $quiz.slideDown();

    saveResult(results);
  }

  function saveResult(results){

    firebase.database().ref('introjquery090618').push().set(results)
      .then(function() {

      }, function(error) {

      });
  }

  function shuffle(array) {
    let currentIndex = array.length,
      temporaryValue,
      randomIndex;

    while (0 !== currentIndex) {

      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  }

  $.ajax({
    dataType: 'json',
    url: url,
    success: function(data){
      title = data['title'];
      questions = data['questions'];
      correctReplies = data['correct-replies'];
      incorrectReplies = data['incorrect-replies'];
      results.total = questions.length;
      init();
    },
    error: function(event, jqxhr, settings, thrownError){
      console.log(event, jqxhr, settings, thrownError)
    }
  });

});
