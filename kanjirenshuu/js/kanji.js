var transTime = 250;
var flashCard = $(".flashCard");
var quizCard = $("#quizCard");
var cardFront = $(".cardFront");
var cardBack = $(".cardBack");
var kanjiLabel = $(".kanjiLabel");
var kanjiList = $("#kanjiList");
var fileList = $("#fileList");
var answerForm = $("#answerForm");
var answerField = $("#answerField");
var quizBack = $("#quizBack");
var answered = $("#numAnswered");
var correct = $("#numCorrect");
var green = "rgb(28, 227, 44)";
var red = "rgb(244, 97, 97)";
var timeout;
var notInTrans = true;
var card = new KanjiCard(new KanjiDeck());
var quiz = new KanjiQuiz();

function KanjiDeck() {
  var kanjiArray;
  var isKanjiRead;
  var countRead = 0;
  var numKanji = 0;
  var currentIndex = -1;
  
  this.readKanji = function(text) {
    kanjiArray = text.split(/[ 　\t\r\n]+/);
    if(kanjiArray[0] == '') kanjiArray.shift();
//    alert(kanjiArray.length);
    if(kanjiArray.length < 3) {
      this.reset();
      alert("No kanji available.");
    } else {
      numKanji = Math.floor(kanjiArray.length/3);
      isKanjiRead = new Array(numKanji);
      fillArray(isKanjiRead, false);
    }
//    alert(numKanji);
  };
  
  this.reset = function() {

    kanjiArray = [];
    isKanjiRead = [];
    countRead = 0;
    numKanji = 0;
    currentIndex = -1;
  };
  
  this.getKanji = function() {
    if(numKanji === 0) {
      return [""];
    } else {
      return [kanjiArray[3 * nextIndex()]]; 
    }
  };
  
  this.getReading = function() {
    if(currentIndex < 0) {
      return "";
    } else {
      return [kanjiArray[3 * currentIndex + 1], kanjiArray[3 * currentIndex + 2]];
    }
  }
  
  this.numberKanji = function() {
    return numKanji;
  }
  
  var fillArray = function(array, value) {
    var end = array.length;
    for(var i = 0; i < end; i++) {
      array[i] = value;
    }
  };
  
  var nextIndex = function() {
    if(++countRead > numKanji) {
      fillArray(isKanjiRead, false);
      countRead = 1;
    }
    while(true) {
      currentIndex = Math.floor(numKanji * Math.random());
      if(!isKanjiRead[currentIndex]) break;
    }
//    alert(kanjiArray[currentIndex]);
    isKanjiRead[currentIndex] = true;
    return currentIndex;
  };

}

function KanjiCard(cardDeck) {
  var isCardFront = false;
  var kanjiDeck = cardDeck;
  
  this.readKanji = function(text) {
    kanjiDeck.readKanji(text);
    isCardFront = false;
  };
  
  this.getWord = function() {
    var word;
    word = isCardFront ? kanjiDeck.getReading() : kanjiDeck.getKanji();
    isCardFront = !isCardFront;
    return word;
  };
  
  this.isFront = function() {
    return isCardFront;
  }
  
  this.numberKanji = function() {
    return kanjiDeck.numberKanji();
  }
  
}

function KanjiQuiz() {

  var numKanji = 0;
  var kanjiAnswered = 0;
  var kanjiCorrect = 0;
  
  this.startQuiz = function() {
    this.resetQuiz();
  };
  
  this.resetQuiz = function() {
    kanjiAnswered = 0;
    kanjiCorrect = 0;
    numKanji = 0;
  };
  
  this.numAnswered = function() {
    return kanjiAnswered;
  };
  
  this.numCorrect = function() {
    return kanjiCorrect;
  };
  
  this.isCorrect = function(answer, hiragana, romaji) {
    var correct = (answer.toLowerCase() === hiragana.toLowerCase()) || (answer.toLowerCase() === romaji.toLowerCase());
    kanjiAnswered++;
    if(correct) kanjiCorrect++;
    return false || correct;
  };
  
  this.setNumKanji = function(num) {
    numKanji = num;
  }
  
  this.quizFinished = function() {
    return numKanji === kanjiAnswered ? true : false;
  }
  
}

function getFiles() { 
  var files, endFor;
  files = $("#fileChooser").get(0).files;
  endFor = files.length;
  for(var i = 0; i < endFor; i++) {
    readFiles(files[i]);
  }
}

function readFiles(file) {
  var reader = new FileReader();
  reader.onload = function() {
    var txt = reader.result;
    $(kanjiList).val($(kanjiList).val() + txt + "\n");
    $("<li>" + file.name + "</li>").appendTo(fileList);
  };
  reader.readAsText(file);
}

function kanjiTransition(isFront, labelText) {
  notInTrans = false;
  $(flashCard).css("transition", "all " + transTime/1000 + "s linear");
  $(flashCard).css("transform", "perspective(800px) rotateY(90deg)");
  $(flashCard).animate({color:'black'}, transTime, function() {
    $(cardFront).css("visibility", (isFront === true ? "hidden" : "visible"));
    $(cardBack).css("visibility", (isFront === true ? "visible" : "hidden"));
    $(kanjiLabel).text(labelText);
    $(flashCard).css("transform", "perspective(800px) rotateY(" + (isFront === true ? "180" : "0") + "deg)");
    setTimeout(function() {notInTrans = true;}, transTime);
  });
}

function onKeyDown(event) {
  if(event.keyCode == 13) {
    if(notInTrans) {
      if(card.isFront()) checkAnswer();
      else if(timeout) {
        clearTimeout(timeout);
        timeoutTrans();
      }
    }
    return false;
  }
}

function checkAnswer() {
  if(card.isFront() && ($(kanjiLabel).text() !== '')) {
//    alert($(answerField).val());
    var readings = card.getWord();
    $(quizBack).css("background-color", quiz.isCorrect($(answerField).val(), readings[0], readings[1]) ? green : red);
    kanjiTransition(true, readings[0]);
    $(answered).text(quiz.numAnswered());
    $(correct).text(quiz.numCorrect());
    timeout = setTimeout(function() { timeoutTrans();}, 1500);
  }
}

function timeoutTrans() {
  timeout = null;
  kanjiTransition(false, card.getWord()[0]);
  $(answerForm)[0].reset();
  if(quiz.quizFinished()) {
    alert("You got " + (100 * quiz.numCorrect()/quiz.numAnswered()).toFixed(2) + "% correct.");
    quiz.resetQuiz();
  }
}

$(document).ready(function() {
  $("#fileChooser").change(function() { 
    getFiles();
  });
  $(flashCard).click(function(event) {
    if(this.id !== "quizCard") kanjiTransition(card.isFront(), card.getWord()[0]);
  });
  $("#clearButton").click(function() {
    $(fileList).empty();
    $(kanjiList).val("");
    $("#form")[0].reset();
    $(kanjiLabel).text("");
  });
  $('.tabs').on('click', function (event) {
    if((event.target.id === 'flashCards') || (event.target.id === 'quiz')) { 
      card.readKanji($(kanjiList).val());
      if(event.target.id === 'quiz') {
        quiz.resetQuiz();
        quiz.setNumKanji(card.numberKanji());
        $(answered).text(0);
        $(correct).text(0);
      }
      kanjiTransition(false, card.getWord()[0]);
    }
  });
  $("#submitButton").on('click', function(event) { checkAnswer();});
//  $.get("file:///Users/STUDLER/Desktop/Web%20Design/kanjirenshuu/Kanji.txt", function( data ) {
//    $(kanjiList).val(data);
//    alert("Load was performed.");
//  });
});