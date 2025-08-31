
        {/* Entries Section */}
        {entries.length > 0 && (
            <div className="bg-white/80 backdrop-blur-lg shadow-2xl rounded-3xl p-8 border border-white/20 animate-slide-in mt-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-700" />
                  الأعضاء المسجلين ({entries.length})
                </h3>
                <button
                  onClick={() => setShowEntries(!showEntries)}
                  className="text-blue-700 hover:text-blue-600 transition-colors duration-200 cursor-pointer">
                  {showEntries ? "إخفاء" : "عرض"}
                </button>
              </div>
  
              {showEntries && (
                <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                  {entries.map((entry, index) => (
                    <div
                      key={entry.id}
                      className="bg-gradient-to-r from-white to-gray-50 rounded-2xl p-4 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up"
                      style={{ animationDelay: `${index * 100}ms` }}>
                      <div className="flex items-center gap-4">
                        <img
                          src={entry.imageUrl}
                          alt={entry.name}
                          className="w-16 h-16 object-cover rounded-full shadow-md border-4 border-white"
                        />
                        <div className="flex-1 space-y-1">
                          <h4 className="font-bold text-gray-800 text-lg">
                            {entry.name}
                          </h4>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {entry.birthdate}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-gray-100 rounded-lg">
                        <p className="text-sm text-gray-700 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-blue-700" />
                          {entry.church}
                        </p>
                        <p className="text-sm text-gray-700 flex items-center gap-1 mt-2">
                          <Phone className="w-3 h-3 text-blue-700" />
                          {entry.phone.replace(/[٠-٩]/g, (d) =>
                            "٠١٢٣٤٥٦٧٨٩".indexOf(d)
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}