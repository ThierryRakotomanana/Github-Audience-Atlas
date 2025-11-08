import { useState } from 'react'
import * as z from 'zod'
import './App.css'

const userLocationSchema = z.string()

function App() {
  const [location, setLocation] = useState<z.infer<typeof userLocationSchema>>()

  const getUserLocation = async(githubUsername : string): Promise<string> => {
  const response = await fetch(`https://api.github.com/users/${githubUsername}`)
  if (!response.ok) throw new Error('Network error')
  const { location } = await response.json()
  const raw = z.parse(userLocationSchema, location)
  setLocation(raw)
  return raw
  }

  return (
    <>
    <button onClick={()=> getUserLocation(`ThierryRakotomanana`)}>Get Location</button>
    <div> {location} </div>
    </>
  )
}

export default App
