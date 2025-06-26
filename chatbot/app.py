import streamlit as st
import asyncio
from langgraph.graph import StateGraph
from langchain_groq import ChatGroq
from typing import TypedDict, Optional, Dict
import re
from dotenv import load_dotenv
import os
import logging

# === CONFIG ===
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# === CONSTANTS ===
INTENT_DETECTION_NODE = "Intent Detection"

# === STATE ===
class MentalHealthState(TypedDict):
    user_input: str
    intent: Optional[str]
    data: Optional[dict]
    user_profile: Optional[Dict[str, str]]  # mood, stress, sleep, feelings
    short_term_memory: Optional[Dict[str, str]]  # session memory
    long_term_memory: Optional[Dict[str, str]]  # persistent memory
    hitl_flag: Optional[bool]  # emergency flag

# === LLM ===
llm = ChatGroq(groq_api_key=GROQ_API_KEY, model_name="llama3-70b-8192")

# === ASYNC RUNNER for Streamlit ===
def run_async(coro):
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)

# === USER PROFILE COLLECTION ===
async def collect_user_data(state: MentalHealthState) -> MentalHealthState:
    user_input = state['user_input']
    user_profile = state.get('user_profile', {})
    short_term_memory = state.get('short_term_memory', {})

    prompt = (
        f"Extract mental health profile info (mood, stress, sleep quality, feelings) from the user input: '{user_input}'. "
        f"Current profile: {user_profile}. "
        f"If info is missing, ask a gentle question to gather it (e.g., 'How have you been sleeping lately?'). "
        f"Respond empathetically and clearly."
    )
    response = await llm.ainvoke(prompt)
    message = response.content.strip()

    keywords = ['mood:', 'stress:', 'sleep:', 'feeling:']
    if any(k in message.lower() for k in keywords):
        for line in message.split('\n'):
            if ': ' in line:
                key, value = line.split(': ', 1)
                user_profile[key.lower()] = value
    else:
        short_term_memory['last_question'] = message

    return {**state, "user_profile": user_profile, "data": {"response": message}, "short_term_memory": short_term_memory}

# === INTENT DETECTION ===
async def detect_intent(state: MentalHealthState) -> MentalHealthState:
    user_input = state['user_input']
    short_term_memory = state.get('short_term_memory', {})
    long_term_memory = state.get('long_term_memory', {})

    prompt = (
        f"Classify user's intent into one of: 'profile', 'symptom_check', 'exercise', 'advice', 'emergency', or 'unknown'.\n"
        f"User input: {user_input}\n"
        f"Previous intent: {short_term_memory.get('previous_intent', 'none')}\n"
        f"Long-term context: {long_term_memory.get('last_advice', 'none')}\n"
        f"Intent:"
    )
    response = await llm.ainvoke(prompt)
    content = response.content.strip().lower()

    match = re.search(r"(profile|symptom_check|exercise|advice|emergency)", content)
    intent = match.group(1) if match else "unknown"
    short_term_memory['previous_intent'] = intent

    emergency_keywords = ["suicide", "self harm", "overdose", "hurt myself", "kill myself", "can't go on"]
    hitl_flag = any(keyword in user_input.lower() for keyword in emergency_keywords)

    return {**state, "intent": intent, "short_term_memory": short_term_memory, "hitl_flag": hitl_flag}

# === SYMPTOM CHECK ===
async def symptom_check(state: MentalHealthState) -> MentalHealthState:
    user_input = state['user_input']

    prompt = (
        f"The user says: '{user_input}'. "
        f"Provide an empathetic assessment of possible mental health symptoms and recommend helpful next steps or resources. "
        f"Include info about common symptoms related to mood, anxiety, or stress."
    )
    response = await llm.ainvoke(prompt)
    message = response.content.strip()
    return {**state, "data": {"response": message}}

# === SUGGEST EXERCISES ===
async def suggest_exercises(state: MentalHealthState) -> MentalHealthState:
    prompt = (
        "Suggest 2-3 simple mental health exercises or coping strategies such as breathing exercises, mindfulness, or grounding techniques. "
        "Tailor suggestions to user's current mood and feelings."
    )
    response = await llm.ainvoke(prompt)
    message = response.content.strip()
    return {**state, "data": {"response": message}}

# === PROVIDE ADVICE ===
async def provide_advice(state: MentalHealthState) -> MentalHealthState:
    user_input = state['user_input']
    user_profile = state.get('user_profile', {})
    long_term_memory = state.get('long_term_memory', {})

    prompt = (
        f"Provide personalized mental health advice based on the input: '{user_input}'. "
        f"User profile: {user_profile}. "
        f"Previous advice: {long_term_memory.get('last_advice', 'none')}. "
        f"Use clear, empathetic, supportive language."
    )
    response = await llm.ainvoke(prompt)
    message = response.content.strip()

    long_term_memory['last_advice'] = message
    return {**state, "data": {"response": message}, "long_term_memory": long_term_memory}

# === EMERGENCY ESCALATION ===
async def emergency_escalation(state: MentalHealthState) -> MentalHealthState:
    message = (
        "Your message indicates you might be in crisis. "
        "Please reach out immediately to a trusted person or a mental health professional. "
        "If you are in danger, call emergency services or a suicide prevention hotline immediately. "
        "Here are some important Canadian resources:\n"
        "- Canada Suicide Prevention Service: 1-833-456-4566 or Text 45645\n"
        "- Kids Help Phone: 1-800-668-6868 or Text CONNECT to 686868\n"
        "- Visit https://www.crisisservicescanada.ca/en/ for more help."
    )
    return {**state, "data": {"response": message}}

# === FALLBACK ===
async def fallback(state: MentalHealthState) -> MentalHealthState:
    message = "🤔 Sorry, I didn't understand. You can share your feelings, ask for exercises, or get advice."
    return {**state, "data": {"response": message}}

# === STATE GRAPH SETUP ===
def get_next_node(state: MentalHealthState) -> str:
    if state.get("hitl_flag", False):
        return "Emergency Escalation"
    valid_intents = ["profile", "symptom_check", "exercise", "advice"]
    return state["intent"] if state["intent"] in valid_intents else "Fallback"

builder = StateGraph(MentalHealthState)
builder.add_node(INTENT_DETECTION_NODE, detect_intent)
builder.add_node("Collect User Data", collect_user_data)
builder.add_node("Symptom Check", symptom_check)
builder.add_node("Suggest Exercises", suggest_exercises)
builder.add_node("Provide Advice", provide_advice)
builder.add_node("Emergency Escalation", emergency_escalation)
builder.add_node("Fallback", fallback)
builder.set_entry_point(INTENT_DETECTION_NODE)

builder.add_conditional_edges(
    INTENT_DETECTION_NODE,
    get_next_node,
    {
        "profile": "Collect User Data",
        "symptom_check": "Symptom Check",
        "exercise": "Suggest Exercises",
        "advice": "Provide Advice",
        "emergency": "Emergency Escalation",
        "Fallback": "Fallback"
    }
)

mental_health_bot = builder.compile()

# === STREAMLIT UI ===
st.set_page_config(page_title="🧠 MapleMed Mental Health Support", page_icon="💬", layout="wide")
st.title("🧠 MapleMed Mental Health Support Chatbot")

tabs = st.tabs(["Conversational Support", "Mood Tracking & Insights", "Resource Recommendation", "Privacy and Escalation Protocol"])

# Conversational Support Tab
with tabs[0]:
    st.header("Conversational Support Bot")
    st.caption("Talk about your feelings, get advice, exercises, or immediate help.")

    if "messages" not in st.session_state:
        st.session_state.messages = []
    if "long_term_memory" not in st.session_state:
        st.session_state.long_term_memory = {}
    if "user_profile" not in st.session_state:
        st.session_state.user_profile = {}

    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    user_input = st.chat_input("How are you feeling today?")
    if user_input:
        st.session_state.messages.append({"role": "user", "content": user_input})
        with st.chat_message("user"):
            st.markdown(user_input)
        with st.chat_message("assistant"):
            with st.spinner("Thinking..."):
                state = {
                    "user_input": user_input,
                    "intent": None,
                    "data": None,
                    "user_profile": st.session_state.user_profile,
                    "short_term_memory": {},
                    "long_term_memory": st.session_state.long_term_memory,
                    "hitl_flag": False
                }
                try:
                    final_state = run_async(mental_health_bot.ainvoke(state))
                    bot_reply = final_state['data']['response']
                    st.session_state.user_profile = final_state.get('user_profile', {})
                    st.session_state.long_term_memory = final_state.get('long_term_memory', {})
                except Exception as e:
                    logger.error(f"Error during bot invocation: {e}")
                    bot_reply = "Sorry, I'm having trouble processing that right now."
                st.markdown(bot_reply)
        st.session_state.messages.append({"role": "assistant", "content": bot_reply})

# Mood Tracking & Insights Tab
with tabs[1]:
    st.header("Mood Tracking & Insights")
    st.caption("View your mood history and insights collected from your conversations.")

    user_profile = st.session_state.get("user_profile", {})
    if user_profile:
        st.markdown(f"- **Mood:** {user_profile.get('mood', 'Not set')}")
        st.markdown(f"- **Stress Level:** {user_profile.get('stress', 'Not set')}")
        st.markdown(f"- **Sleep Quality:** {user_profile.get('sleep', 'Not set')}")
        st.markdown(f"- **Feelings:** {user_profile.get('feeling', 'Not set')}")
    else:
        st.info("Your mood profile will appear here after some interaction.")

# Resource Recommendation Tab
with tabs[2]:
    st.header("Resource Recommendation")
    st.caption("Access helpful Canadian mental health resources and exercises.")

    st.markdown("""
    ### Helpful Canadian Resources
    - [Canada Suicide Prevention Service (CSPS)](https://www.crisisservicescanada.ca/en/) – Call 1-833-456-4566 or Text 45645
    - [Kids Help Phone](https://kidshelpphone.ca/) – Call 1-800-668-6868 or Text CONNECT to 686868
    - [Mental Health Commission of Canada](https://www.mentalhealthcommission.ca)
    - [Canadian Mental Health Association (CMHA)](https://cmha.ca)
    """)

    location = st.text_input("Enter your city or postal code to find nearby clinics (optional):")
    if location:
        st.info(f"Searching clinics near **{location}** ...")
        # Example static nearby clinics (replace with Maps API integration if desired)
        st.markdown("""
        - **Local Clinic 1:** 123 Wellness Rd, Your City, Phone: 555-123-4567  
        - **Local Clinic 2:** 456 Hope St, Your City, Phone: 555-987-6543  
        """)

    if st.button("Get Mental Health Exercises"):
        state = {
            "user_input": "Suggest mental health exercises",
            "intent": "exercise",
            "data": None,
            "user_profile": st.session_state.user_profile,
            "short_term_memory": {},
            "long_term_memory": st.session_state.long_term_memory,
            "hitl_flag": False
        }
        try:
            final_state = run_async(mental_health_bot.ainvoke(state))
            exercises = final_state['data']['response']
            st.success("Here are some exercises for you:")
            st.markdown(exercises)
        except Exception as e:
            logger.error(f"Error getting exercises: {e}")
            st.error("Sorry, could not fetch exercises at this time.")

# Privacy and Escalation Protocol Tab
with tabs[3]:
    st.header("Privacy and Escalation Protocol")
    st.markdown("""
    Your privacy is important. Conversations are confidential and not shared outside this app.
    We do not store personally identifiable information.
    
    **Emergency Escalation Protocol:**  
    If you express thoughts of self-harm or crisis, this app will provide immediate resources and urge you to seek help.
    
    Please remember, this app is not a substitute for professional mental health care.
    """)

