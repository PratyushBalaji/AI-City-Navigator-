# Travel Agentic

Planning a vacation is hard. Knowing places, knowing people, even know what apps to use! Introducing... Travel Agentic! An AI-based platform that plans itineraries based on your specific trip needs!

# AGENT.md

## AI Travel Companion – Intelligent City Exploration Platform

### Project Overview

This project is an AI-powered travel planning platform designed to help users explore new cities effortlessly. The system generates personalized travel itineraries, recommends essential local apps, and presents the experience through an AI-generated itinerary video.

The platform helps travelers discover transportation options, local events, restaurants, hidden attractions, and social experiences in a new city while staying within their budget and interests.

The product consists of:

* A modern interactive website
* A mobile-friendly interface
* AI-powered itinerary generation
* AI-generated itinerary videos
* A global exploration interface using a 3D globe

---

# Core Idea

When travelers arrive in a new city, they must solve multiple problems:

* Transportation
* Navigation
* Food discovery
* Events and entertainment
* Local apps
* Social interaction
* Budget planning

Instead of manually searching across multiple platforms, this app acts as a **central intelligent travel assistant**.

Users enter travel information and the system generates:

1. A structured itinerary
2. Recommended local apps
3. Activity suggestions
4. Transportation methods
5. Budget-aware travel plans
6. An AI-generated visual itinerary video

---

# Target Users

Primary Users:

* International travelers
* Tourists visiting new cities
* Students traveling abroad
* Digital nomads
* Short-term visitors

Secondary Users:

* Locals exploring their own city
* Event discoverers
* Social travelers

---

# Core Features

## 1. Interactive Landing Page

The homepage contains a **3D rotating globe interface**.

Features:

* Interactive rotating Earth globe
* Country map textures
* City markers for popular destinations
* Hoverable city tooltips
* Animated glow markers
* Dark space background with stars

Popular Cities Displayed:

* Toronto
* New York
* Tokyo
* London
* Paris
* Barcelona
* Taj Mahal

Users can click cities to explore suggested travel routes.

---

## 2. Smart Trip Input Panel

Below the globe is a large interactive card where users input travel details.

Inputs include:

Destination City
Travel Duration
Budget
Travel Style
Interests

Interest tags include:

* Food
* Nightlife
* Culture
* Nature
* Adventure
* Museums
* Photography
* Shopping

Main action button:

**"Generate My AI Trip"**

---

## 3. AI Itinerary Generator

The AI generates a structured itinerary based on user inputs.

Example Output:

Day 1
Arrival → Airport transport → Hotel check-in → Downtown walk → Local food market

Day 2
Morning coffee spot → Museum visit → Park exploration → Evening nightlife

The itinerary considers:

* Distance optimization
* Transportation options
* Opening hours
* User interests
* Budget constraints

---

## 4. Local App Recommendation Engine

The system recommends apps relevant to the destination city.

Examples:

Transportation

* Uber
* Lyft
* Local taxi apps

Food

* Yelp
* Google Maps
* Local food delivery apps

Events

* Eventbrite
* Meetup
* Local event platforms

Social

* Bumble BFF
* Meetup groups

---

## 5. AI Generated Itinerary Video

Instead of displaying only text, the system generates a **1-minute cinematic travel preview video**.

The video includes:

* Destination highlights
* Route overview
* Attraction previews
* Transportation segments
* Event suggestions

The video style resembles:

* Cruise itinerary previews
* Travel documentaries
* Safari experience intros

Example Flow:

Toronto Arrival
↓
CN Tower Visit
↓
Subway Ride Downtown
↓
Food Market Visit
↓
Nightlife Recommendation

---

## 6. Smart Event Discovery

The system identifies:

* Local festivals
* Live events
* Concerts
* Exhibitions
* Cultural activities

Events are filtered based on:

* Location proximity
* Travel duration
* User interests

---

## 7. Exploration Mode

Users can explore cities directly on the globe.

Features include:

* Clickable city markers
* Travel route visualization
* Highlighted destination paths
* Animated flight arcs between cities

Example path:

Toronto → New York → Paris → Barcelona

---

# Technical Architecture

## Frontend

Framework:
Next.js

Language:
TypeScript

Styling:
Tailwind CSS

3D Graphics:
React Three Fiber
Three.js
Drei

UI Libraries:
Framer Motion (animations)
Shadcn UI

---

## Backend

Node.js

API Layer:
Express or Next.js API routes

Responsibilities:

* AI request processing
* itinerary generation
* event data fetching
* location analysis

---

## AI Layer

Models used:

Amazon Nova Models

Recommended usage:

Nova Lite

* itinerary generation
* travel recommendations

Nova Pro

* reasoning and structured planning

Nova Canvas

* generating visual travel scenes

Nova Reel

* generating short itinerary videos

---

## Data Sources

Maps:
Google Maps API
OpenStreetMap

Events:
Ticketmaster API
Eventbrite API
Meetup API

Transport:
City transit APIs
Uber / Lyft information

---

# Tech Stack Summary

Frontend
Next.js
React
Tailwind
Framer Motion
React Three Fiber

Backend
Node.js
Express
REST APIs

AI
Amazon Nova Models

Infrastructure
AWS
S3 (media storage)
Lambda (AI requests)

---

# Future Features

Possible extensions:

AI Travel Companion Chatbot

Voice travel assistant

Augmented Reality city exploration

Offline travel mode

Real-time travel updates

Flight and hotel integration

Group travel planning

Social trip sharing

---

# Design Goals

The application should feel:

Modern
Futuristic
Interactive
AI-driven
Exploration-focused

The user experience should resemble:

* Google Earth
* Airbnb travel inspiration
* Apple-level UI polish

---

# Development Philosophy

Build the system modularly.

Suggested development order:

1. Landing page UI
2. Interactive globe
3. Trip input interface
4. Itinerary generation logic
5. AI model integration
6. Video generation pipeline
7. Event discovery system

---

# Current Status

Frontend development started.

Interactive globe implemented using React Three Fiber.

Next step:

Implement itinerary generation engine and AI model integration.