'use client'
import { useState, useEffect } from 'react'
import { auth } from '@/lib/firebase'

interface RecordModalProps {
  record: any
  onClose: () => void
}

const BIKE_TYPES = ['CD70', 'CD Dream', 'Pridor', 'CG125', 'CG125 Self', 'CB125', 'CB150']

const SERVICE_CHECKLIST = [
  'انجن چیک',
  'آئل فلٹر کی',
  'گئیر کا چیک اور پاپر بریک آٹو ایڈجسٹ',
  'ہائیڈروفلک اور پاپر بریک',
  'ہائیڈروفلک چیک کیسٹ مکمل کی',
  'گئیر کی ایگزاسٹ پائپ کی اور فرٹ زمبی کی',
  'گلیفٹر کبریکٹر کی سیٹنگ کی',
  'انجن ماؤنٹ چیک',
  'باڈی پلاگ چیک',
  'ڈور بریکیٹ سیٹنگ کی',
  'فرنٹ سسپنشن (ڈیپر ریڈیکل سیٹیبل پائپ کی آل ٹائٹ چیک وغیرہ)',
  'انٹینا بریکیٹ کی چیک کی گریسنگ',
  'پیٹ فیول ٹینک فلٹر براس',
  'پلاٹ ہوئیل کی گاپ کا اندام جہاں',
  'فرنٹ پائپ کی انٹی انفیکشن (اکسلریٹر کیریر لاگری کی)',
  'میٹر اینڈ اسلیٹنگ'
]

export default function RecordModal({ record, onClose }: RecordModalProps) {
  const [formData, setFormData] = useState({
    itemNumber: '',
    name: '',
    phone: '',
    bikeType: 'CD70',
    kmReading: 0,
    currentDate: new Date().toISOString().split('T')[0],
    nextServiceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    services: [] as string[],
    parts: [] as Array<{name: string, code: string, rate: number}>,
    laborCharges: 0,
    partsCharges: 0,
    notes: '',
    labourType: '',
    customerType: ''
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (record) {
      setFormData({
        itemNumber: record.itemNumber || '',
        name: record.name || '',
        phone: record.phone || '',
        bikeType: record.bikeType || 'CD70',
        kmReading: record.kmReading || 0,
        currentDate: record.currentDate || new Date().toISOString().split('T')[0],
        nextServiceDate: record.nextServiceDate || '',
        services: record.services || [],
        parts: record.parts || [],
        laborCharges: record.laborCharges || 0,
        partsCharges: record.partsCharges || 0,
        notes: record.notes || '',
        labourType: record.labourType || '',
        customerType: record.customerType || ''
      })
    }
  }, [record])

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }))
  }

  const handleSave = async (finalize = false) => {
    setLoading(true)
    try {
      const token = await auth.currentUser?.getIdToken()
      const url = record 
        ? `https://motomind-backend-production.up.railway.app/api/records/${record.id}`
        : 'https://motomind-backend-production.up.railway.app/api/records'
      
      const method = record ? 'PUT' : 'POST'
      
      const totalAmount = formData.laborCharges + formData.partsCharges

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          totalAmount,
          finalized: finalize
        })
      })

      if (response.ok) {
        if (finalize && !record) {
          const data = await response.json()
          await fetch(`https://motomind-backend-production.up.railway.app/api/records/${data.id}/finalize`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        }
        onClose()
      } else {
        alert('Failed to save record')
      }
    } catch (error) {
      console.error('Error saving record:', error)
      alert('Error saving record')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">
            {record ? 'Edit Service Record' : 'Add Service Record'}
          </h2>

          <div className="space-y-6">
            {/* Top Section - BLUE AREA */}
            <div className="border-2 border-blue-500 bg-blue-50 p-4 rounded">
              <h3 className="font-semibold mb-3 text-right">تفصیل شماره</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-right">نمبر آئٹم</label>
                  <input
                    type="text"
                    value={formData.itemNumber}
                    onChange={(e) => setFormData({...formData, itemNumber: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-right"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-right">نام</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-right"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-right">بائیک ٹائپ</label>
                  <select
                    value={formData.bikeType}
                    onChange={(e) => setFormData({...formData, bikeType: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-right"
                  >
                    {BIKE_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm mb-1 text-right">تاریخ موجودہ</label>
                  <input
                    type="date"
                    value={formData.currentDate}
                    disabled
                    className="w-full px-3 py-2 border rounded bg-gray-100 text-right"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-right">تاریخ اگلی سروس</label>
                  <input
                    type="date"
                    value={formData.nextServiceDate}
                    onChange={(e) => setFormData({...formData, nextServiceDate: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm mb-1 text-right">فون نمبر</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-right"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-right">کلومیٹر ریڈنگ</label>
                  <input
                    type="number"
                    value={formData.kmReading}
                    onChange={(e) => setFormData({...formData, kmReading: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded text-right"
                  />
                </div>
              </div>
            </div>

            {/* Service Checklist - BLACK AREA (Checkboxes) */}
            <div className="border-2 border-gray-800 bg-white p-4 rounded">
              <h3 className="font-semibold mb-3 text-right">کام کی فہرست (A)</h3>
              <div className="space-y-2">
                {SERVICE_CHECKLIST.map((service, index) => (
                  <label key={service} className="flex items-center justify-end space-x-2 space-x-reverse cursor-pointer border-b pb-2">
                    <span className="text-sm text-right flex-1">{service}</span>
                    <span className="text-sm font-semibold w-8 text-center">{index + 1}</span>
                    <input
                      type="checkbox"
                      checked={formData.services.includes(service)}
                      onChange={() => handleServiceToggle(service)}
                      className="w-5 h-5"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* RED AREA - Parts and Additional Info */}
            <div className="border-2 border-red-500 bg-red-50 p-4 rounded">
              <h3 className="font-semibold mb-3 text-right">پرزے</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-right">لیبر کی قسم</label>
                  <input
                    type="text"
                    value={formData.labourType}
                    onChange={(e) => setFormData({...formData, labourType: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-right bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-right">کسٹمر کی قسم</label>
                  <input
                    type="text"
                    value={formData.customerType}
                    onChange={(e) => setFormData({...formData, customerType: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-right bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Section - BLUE AREA (Charges) */}
            <div className="border-2 border-blue-500 bg-blue-50 p-4 rounded">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-right">لیبر چارجز</label>
                  <input
                    type="number"
                    value={formData.laborCharges}
                    onChange={(e) => setFormData({...formData, laborCharges: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded text-right"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-right">پرزوں کے چارجز</label>
                  <input
                    type="number"
                    value={formData.partsCharges}
                    onChange={(e) => setFormData({...formData, partsCharges: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded text-right"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm mb-1 text-right font-bold">کل رقم</label>
                <input
                  type="number"
                  value={formData.laborCharges + formData.partsCharges}
                  disabled
                  className="w-full px-3 py-2 border rounded text-right bg-gray-100 font-bold text-lg"
                />
              </div>
            </div>

            {/* Additional Notes */}
            <div className="border p-4 rounded">
              <h3 className="font-semibold mb-3 text-right">نوٹ</h3>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-3 py-2 border rounded text-right"
                rows={3}
                placeholder="اضافی نوٹس..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Discard
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Finalize Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  )

}

