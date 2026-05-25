'use client'

import { useState } from 'react'

export default function Recommendations() {
  const [formData, setFormData] = useState({
    recommendingMember: '',
    recommendedMember: '',
    businessDescription: '',
    referralDetails: '',
  })

  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send data to backend
    console.log('Recommendation submitted:', formData)
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setFormData({
        recommendingMember: '',
        recommendedMember: '',
        businessDescription: '',
        referralDetails: '',
      })
    }, 3000)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-blue-900 mb-8">Give a Recommendation</h1>

      {submitted && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          ✓ Recommendation submitted successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md">
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">
            Your Name (Recommending Member)
          </label>
          <input
            type="text"
            name="recommendingMember"
            value={formData.recommendingMember}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
            placeholder="Enter your name"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">
            Recommended Member/Business
          </label>
          <input
            type="text"
            name="recommendedMember"
            value={formData.recommendedMember}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
            placeholder="Name or business name"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">
            Business Description
          </label>
          <textarea
            name="businessDescription"
            value={formData.businessDescription}
            onChange={handleChange}
            required
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
            placeholder="Describe the business or service"
          ></textarea>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">
            Why are you recommending them?
          </label>
          <textarea
            name="referralDetails"
            value={formData.referralDetails}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
            placeholder="Explain the recommendation and potential opportunities"
          ></textarea>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
        >
          Submit Recommendation
        </button>
      </form>

      <div className="mt-12 bg-blue-50 p-8 rounded-lg">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">Strong Recommendations Build Our Network</h2>
        <p className="text-gray-700">
          Sharing quality referrals and recommendations is at the heart of BNI.
          Your recommendations help connect our members with valuable business opportunities.
        </p>
      </div>
    </div>
  )
}
