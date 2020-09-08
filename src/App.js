import React, { useReducer, useState, useRef } from 'react';

//css
import './App.module.css';

//external
import * as mobilenet from "@tensorflow-models/mobilenet"//import the machine learning library
import * as tf from '@tensorflow/tfjs'//import tensforflow

const state_machine = {

  initial: "initial",

  states: {//hold the different states of the application

    initial: { on: { next: "loading_model" } },//initial state - load model button
    loading_model: { on: { next: "awaiting_upload" } },//second state - waiting for model to be loaded
    awaiting_upload: { on: { next: "ready" } },//third state - waiting for image to be uploaded
    ready: { on: { next: "classifying" }, show_image: true },//fourth state - waiting for user to proceed to classifying the image
    classifying: { on: { next: "complete" } },//fifth state - image being classified
    complete: { on: { next: "awaiting_upload" }, show_image: true, show_results: true }//Final state - results displayed to the user

  }

}

//take the current state, and call the on.next property, changing the current state to the next state
const reducer = (current_state, event) => state_machine.states[current_state].on[event] || state_machine.initial //otherwise set it to the initial state



const App = () => {

  tf.setBackend("cpu")//initialise the backend of tensorflow

  //*hooks
  const [state, dispatch] = useReducer(reducer, state_machine.initial)//reducer used to update the state machine

  const [model, set_model] = useState(null)//state to hold the model loaded in from tensorflow
  const [uploaded_image, set_uploaded_image] = useState(null)//hold the image which the user had uploaded
  const [results, set_results] = useState([])//hold the image which has been classified

  const input_ref = useRef(null)//define a ref to point to the input
  const image_ref = useRef(null)//define a ref to point to the uploaded image

  //_functions
  const next = () => dispatch("next")//utility function to dispatch the next action

  const load_model = async () => {

    next()//tranistion from initial to loading model state

    const mobilenet_model = await mobilenet.load()//load the model from mobilenet
    set_model(mobilenet_model)//once it is loaded, store the model in the state

    next()//tranistion from loading model to awaiting upload

  }

  const handle_upload = e => {

    const { files } = e.target//destructure the uploaded files from the event

    if (files.length > 0) {//if they have uploaded at least 1 file

      const image_url = URL.createObjectURL(files[0])//create a url for the first uploaded file
      set_uploaded_image(image_url)//store the image url into the state

      next()//transition into the ready state

    }

  }

  const classify_image = async () => {

    next()//transition from ready to identifying state
    next()//transition from identifying state to complete

    const results = await model.classify(image_ref.current)//use the machine learning library to identify the image
    set_results(results)

    console.log(results)

  }

  const format_result = ({ className, probability }) => {

    return <li key={className}>

      {`${className}: ${(probability * 100).toFixed(2)}%`}

    </li>

  }
  const button_props = {

    initial: { text: "Load model", action: load_model },
    loading_model: { text: "Loading model...", action: () => { } },
    awaiting_upload: { text: "Upload a photo", action: () => input_ref.current.click() },
    ready: { text: "Identify image", action: classify_image },
    classifying: { text: "Identifying...", action: () => { } },
    complete: { text: "Try another", action: next }

  }

  const { show_image } = state_machine.states[state]//check the current state to see if show_image is true
  const { show_results } = state_machine.states[state]//check the current state to see if show_image is true

  return (

    <div>

      <img src={uploaded_image} alt="Uploaded image" ref={image_ref} style={{ display: show_image ? "block" : "none" }} />

      <ul style={{ display: show_results ? "block" : "none" }}>

        {results.map(result => format_result(result))}

      </ul>

      <input type="file" accept="image/*" capture="camera" ref={input_ref} onChange={handle_upload} />

      <button onClick={button_props[state].action}>{button_props[state].text}</button>

    </div>

  )

}

export default App;
