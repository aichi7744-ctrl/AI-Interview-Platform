import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ServerUrl } from "../App";
import { FaArrowLeft } from "react-icons/fa";

const InterviewHistory = () => {
  const [interviews, setInterviews] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const getMyInterviews = async () => {
      try {
        const result = await axios.get(
          ServerUrl + "/api/interview/get-interview",
          {
            withCredentials: true,
          },
        );

        // console.log(result.data);

        setInterviews(result.data);
      } catch (error) {
        console.log(error.response?.data || error.message);
      }
    };

    getMyInterviews();
  }, []);

  return (
    <div
      className="min-h-screen bg-linear-to-br from-gray-50
    to-emerald-50 py-10"
    >
      <div
        className="w-[90vw] lg:w-[70vw] max-w-[90%]
        mx-auto"
      >
        <div
          className="mb-10 w-full flex items-start
          gap-4 flex-wrap"
        >
          <button
            onClick={() => navigate("/")}
            className="mt-1 p-3 rounded-full bg-white 
            shadow hover:shadow-md transition"
          >
            <FaArrowLeft className="text-gray-600" />
          </button>

          <div className="">
            <h1
              className=" text-3xl font-bold text-gray-800
               flex-nowrap"
            >
              Interview Histroy
            </h1>

            <p className="text-gray-500 mt-2">
              Track your past Interviewsa and performance report
            </p>
          </div>
        </div>

        {interviews.length === 0 ? (
          <div
            className="bg-white p-10 rounded-2xl
           shadow text-center"
          >
            <p className="text-gray-500">
              No interview Found. Start your first interview.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {interviews.map((item, index) => (
              <div
                key={item._id || index}
                onClick={() => navigate(`/report/${item._id}`)}
                className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl
  transition-all duration-300 cursor-pointer border border-gray-100"
              >
                <div
                  className="grid grid-cols-1 md:grid-cols-3 items-center
    gap-6"
                >
                  {/* LEFT SECTION - ROLE INFO */}
                  <div className="text-center md:text-left">
                    <h3 className="text-xl font-semibold text-gray-800 capitalize">
                      {item.role}
                    </h3>

                    <p className="text-gray-500 text-sm mt-1">
                      {item.experience} • {item.mode}
                    </p>

                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* CENTER SECTION - SCORE */}
                  <div className="text-center">
                    <p className="text-3xl font-bold text-emerald-600">
                      {item.finalScore || 0}/10
                    </p>

                    <p className="text-sm text-gray-400 mt-1">Overall Score</p>
                  </div>

                  {/* RIGHT SECTION - STATUS */}
                  <div className="flex justify-center md:justify-end">
                    <span
                      className={`px-5 py-2 rounded-full text-sm font-semibold ${
                        item.status === "completed"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewHistory;
