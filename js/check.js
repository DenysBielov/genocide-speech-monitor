async function checkText() {
  toggleLoader(true);
  const textarea = document.getElementById("speech-text");

  const openAIResponse = await fetch(
    "https://genocide-detector-app.azurewebsites.net/api/genoside-speech-analizer",
    {
      method: "POST",
      body: textarea.value,
    }
  );
  const analysisResult = await openAIResponse;

  const analyseWrapper = document.getElementsByClassName("analyse-wrapper")[0];

  try {
    if (!analysisResult.ok) {
      throw "Response is not successful. " + analysisResult.statusText;
    }
    const analysisObject = await analysisResult.json();

    const statements = [
      ...analysisObject.Dehumanization.Statements,
      ...analysisObject.Misinformation.Statements,
      ...analysisObject.OppressionCalls.Statements
    ]

    const analysisTextNode = createAnalysisNode(
      statements.join(" "),
      analysisObject.TotalPercent
    );
    analyseWrapper.replaceWith(analysisTextNode);
  } catch (e) {
    const errorNode = createErrorNode(
      "An unexpected error occured. Try again later."
    );

    analyseWrapper.replaceWith(errorNode);
  }
  toggleLoader(false);
}

function createErrorNode(errorMessage) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("analyse-wrapper");
  wrapper.classList.add("error");

  wrapper.innerHTML = errorMessage;

  return wrapper;
}

function createAnalysisNode(text, percentage) {
  const statementSpan = document.createElement("span");
  const totalSpan = document.createElement("span");
  const statementTextSpan = document.createElement("span");
  const percentageSpan = document.createElement("span");
  const wrapper = document.createElement("div");
  wrapper.classList.add("analyse-wrapper");

  statementSpan.innerHTML = "Statement:";
  statementSpan.classList.add("label");
  totalSpan.innerHTML = "Total:";
  totalSpan.classList.add("label");
  statementTextSpan.innerHTML = text;
  statementTextSpan.classList.add("text");
  percentageSpan.innerHTML = percentage;
  percentageSpan.classList.add("percentage");

  const textWrapper = document.createElement("div");
  textWrapper.classList.add("text-wrapper");
  textWrapper.appendChild(statementSpan);
  textWrapper.appendChild(statementTextSpan);

  const percentageWrapper = document.createElement("div");
  percentageWrapper.appendChild(totalSpan);
  percentageWrapper.appendChild(percentageSpan);

  wrapper.appendChild(textWrapper);
  wrapper.appendChild(percentageWrapper);

  return wrapper;
}

function toggleLoader(show = false) {
  const loader = document.getElementsByClassName("loader")[0];
  if (!loader) {
    return;
  }
  loader.style.display = show ? "block" : "none";
  toggleTextArea(show);
  toggleCheckButton(show);
}

function toggleTextArea(disabled = false) {
  const textarea = document.getElementById("speech-text");

  textarea.disabled = disabled;
}

function toggleCheckButton(disabled = false) {
  const checkButton = document.getElementById("check-button");

  checkButton.disabled = disabled;
}

function handleTextAreaChange() {
  const textarea = document.getElementById("speech-text");

  if (textarea.value) {
    toggleCheckButton(false);
  } else {
    toggleCheckButton(true);
  }
}

function init() {
  const textarea = document.getElementById("speech-text");

  if (textarea.addEventListener) {
    textarea.addEventListener("input", handleTextAreaChange, false);
  } else if (textarea.attachEvent) {
    textarea.attachEvent("onpropertychange", handleTextAreaChange);
  }
}

document.addEventListener("DOMContentLoaded", init, false);
