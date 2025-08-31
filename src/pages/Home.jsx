import React, { useState } from "react";
import Football from "../icons/Football";
import Chess from "../icons/Chess";
import Pong from "../icons/Pong";
import Run from "../icons/Run";
import Volleyball from "../icons/Volleyball";
import Gamepad from "../icons/Gamepad";
import Calender from "../icons/Calendar";
import Target from "../icons/Target";
import Trophy from "../icons/Trophy";
import User from "../icons/User";
import Users from "../icons/Users";
import Card from "../components/Card";

export default function Home() {
  const games = [
    { name: "كرة قدم", icon: <Football /> },
    { name: "شطرنج", icon: <Chess /> },
    { name: "تنس طاولة", icon: <Pong /> },
    { name: "جرى تتابع", icon: <Run /> },
    { name: "كرة اليد", icon: <Volleyball /> },
  ];

  const stages = [
    {
      name: "المرحلة الأولى (مرحلة الطفولة)",
      age: "4-6 سنوات",
    },
    {
      name: "المرحلة الثانية (إبتدائى)",
      age: "7-12 سنة",
    },
    {
      name: "المرحلة الثالثة (إعدادى)",
      age: "13-15 سنة",
    },
    {
      name: "المرحلة الرابعة (ثانوى)",
      age: "16-18 سنة",
    },
    {
      name: "المرحلة الخامسة (شباب)",
      age: "19-25 سنة",
    },
    {
      name: "المرحلة السادسة (خريجين)",
      age: "25+ سنة",
    },
  ];

  const types = [
    {
      name: "فردى",
      icon: <User />,
    },
    {
      name: "جماعى",
      icon: <Users />,
    },
  ];

  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedStage, setSelectedStage] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [savedEntries, setSavedEntries] = useState([]);

  const handleSave = (personData) => {
    const newEntry = {
      game: selectedGame,
      stage: selectedStage,
      type: selectedType,
      ...personData,
    };
    setSavedEntries((prev) => [...prev, newEntry]);
  };

  return (
    <div className="min-h-screen">
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-20 h-20 border-3 border-blue-700 rounded-full mb-6">
          <Trophy />
        </div>
        <h1 className="text-4xl font-bold text-blue-700 mb-2">
          مهرجان الكرازة المرقسية {new Date().getFullYear()}
        </h1>
        <h2 className="text-2xl font-bold text-blue-700 mb-4">
          المسابقة الرياضية - بورسعيد
        </h2>
        <p className="text-blue-700 text-md">
          اختر نوع اللعبة والمرحلة العمرية ونوع المسابقة لبدء التسجيل
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-12">
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-700 rounded-full text-white font-bold text-lg">
              1
            </div>
            <h2 className="text-3xl font-bold text-blue-700 flex items-center gap-3">
              <Gamepad /> اختر اللعبة
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {games.map((game) => (
              <button
                key={game.name}
                onClick={() => {
                  setSelectedGame(game.name);
                  setSelectedStage(null);
                  setSelectedType(null);
                }}
                className="relative overflow-hidden rounded-2xl p-4 text-blue-700 transform hover:-translate-y-2 transition-all duration-300 border border-blue-700 w-full">
                <div className="flex flex-col justify-center items-center h-full">
                  <div className="mb-3">{game.icon}</div>
                  <h3 className="font-bold text-lg">{game.name}</h3>
                  {selectedGame === game.name && (
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedGame && (
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-700 rounded-full text-white font-bold text-lg">
                2
              </div>
              <h2 className="text-3xl font-bold text-blue-700 flex items-center gap-3">
                <Calender /> اختر المرحلة العمرية
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stages.map((stage) => (
                <button
                  key={stage.name}
                  onClick={() => {
                    setSelectedStage(stage.name);
                    setSelectedType(null);
                  }}
                  className="relative overflow-hidden rounded-2xl p-4 text-blue-700 transform hover:-translate-y-2 transition-all duration-300 border border-blue-700 w-full">
                  <div className="text-center h-full flex flex-col justify-center">
                    <h3 className="font-bold text-lg mb-2">{stage.name}</h3>
                    <p className="text-sm opacity-90">{stage.age}</p>
                    {selectedStage === stage.name && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedStage && (
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-700 rounded-full text-white font-bold text-lg">
                3
              </div>
              <h2 className="text-3xl font-bold text-blue-700 flex items-center gap-3">
                <Target /> اختر نوع المسابقة
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {types.map((type) => {
                return (
                  <button
                    key={type.name}
                    onClick={() => setSelectedType(type.name)}
                    className="relative flex flex-col justify-center items-center gap-2 overflow-hidden rounded-2xl p-4 text-blue-700 transform hover:-translate-y-2 transition-all duration-300 border border-blue-700 w-full">
                    <div className="text-center h-full flex flex-col justify-center items-center">
                      {type.icon}
                      <h3 className="font-bold text-xl mb-2">{type.name}</h3>
                      {selectedType === type.name && (
                        <div className="absolute top-2 right-2">
                          <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {selectedType && (
          <div className="mb-8">
            <div className="bg-blue-50 border border-blue-700 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-blue-700 mb-4 flex items-center">
                <Trophy size={44} />
                ملخص الاختيارات
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <Gamepad size={20} />
                  <div>
                    <p className="text-sm text-blue-700">اللعبة</p>
                    <p className="font-semibold text-blue-700">
                      {selectedGame}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calender size={20} />
                  <div>
                    <p className="text-sm text-blue-700">المرحلة</p>
                    <p className="font-semibold text-blue-700">
                      {selectedStage}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Target size={20} />
                  <div>
                    <p className="text-sm text-blue-700">النوع</p>
                    <p className="font-semibold text-blue-700">
                      {selectedType}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedType === "فردى" && <Card onSave={handleSave} />}

        {selectedType === "جماعى" && <Card onSave={handleSave} />}

        {savedEntries.length > 0 && (
          <div className="mt-4 overflow-x-auto max-h-120 overflow-y-auto">
            <table className="min-w-full border border-blue-700 rounded-lg overflow-hidden text-xs">
              <thead className="bg-blue-700 text-white">
                <tr>
                  <th className="px-4 py-2 border border-blue-700 text-xs">
                    اللعبة
                  </th>
                  <th className="px-4 py-2 border border-blue-700 text-xs">
                    المرحلة
                  </th>
                  <th className="px-4 py-2 border border-blue-700 text-xs">
                    نوع المسابقة
                  </th>
                  <th className="px-4 py-2 border border-blue-700 text-xs">
                    اسم الشخص
                  </th>
                  <th className="px-4 py-2 border border-blue-700 text-xs">
                    تاريخ الميلاد
                  </th>
                  <th className="px-4 py-2 border border-blue-700 text-xs">
                    الكنيسة
                  </th>
                  <th className="px-4 py-2 border border-blue-700 text-xs">
                    رقم الهاتف
                  </th>
                </tr>
              </thead>
              <tbody>
                {savedEntries.map((entry, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-blue-50" : "bg-blue-100"}>
                    <td className="px-4 py-2 border border-blue-700 text-center text-xs">
                      {entry.game}
                    </td>
                    <td className="px-4 py-2 border border-blue-700 text-center text-xs">
                      {entry.stage}
                    </td>
                    <td className="px-4 py-2 border border-blue-700 text-center text-xs">
                      {entry.type}
                    </td>
                    <td className="px-4 py-2 border border-blue-700 text-center text-xs">
                      {entry.name}
                    </td>
                    <td className="px-4 py-2 border border-blue-700 text-center text-xs">
                      {entry.birthdate}
                    </td>
                    <td className="px-4 py-2 border border-blue-700 text-center text-xs">
                      {entry.church}
                    </td>
                    <td className="px-4 py-2 border border-blue-700 text-center text-xs">
                      {entry.phone}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
