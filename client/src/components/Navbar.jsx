import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import { motion } from "motion/react";

import { BsRobot, BsCoin } from "react-icons/bs";
import { HiOutlineLogout } from "react-icons/hi";
import { FaUserAstronaut } from "react-icons/fa";

import { useNavigate } from "react-router-dom";

import axios from "axios";

import { ServerUrl } from "../App";

import { setUserData } from "../redux/userSlice";

import AuthModel from "./AuthModel";

const Navbar = () => {

  const { userData } = useSelector(
    (state) => state.user
  );

  const dispatch = useDispatch();

  const navigate = useNavigate();

  const [showCreditPopup, setShowCreditPopup] =
    useState(false);

  const [showUserPopup, setShowUserPopup] =
    useState(false);

  const [showAuth, setShowAuth] =
    useState(false);


  // ======================
  // Logout Function
  // ======================

  const handleLogOut = async () => {

    try {

      await axios.get(
        ServerUrl + "/api/auth/logout",
        {
          withCredentials: true,
        }
      );

      // Clear Redux User Data
      dispatch(setUserData(null));

      // Close Popups
      setShowUserPopup(false);
      setShowCreditPopup(false);

      // Redirect
      navigate("/");

    } catch (error) {

      console.log(error);

    }
  };


  return (
    <div
      className="
      bg-[#f3f3f3]
      flex
      justify-center
      px-4
      pt-6
      "
    >

      <motion.div
        initial={{ opacity: 0, y: -40 }}

        animate={{ opacity: 1, y: 0 }}

        transition={{ duration: 0.3 }}

        className="
        w-full
        max-w-6xl
        bg-white
        rounded-[24px]
        shadow-sm
        border
        border-gray-200
        px-8
        py-4
        flex
        justify-between
        items-center
        relative
        "
      >

        {/* ======================
            LEFT SIDE
        ====================== */}

        <div
          className="
          flex
          items-center
          gap-3
          cursor-pointer
          "
        >

          <div
            className="
            bg-black
            text-white
            p-2
            rounded-lg
            "
          >
            <BsRobot size={18} />
          </div>

          <h1
            className="
            font-semibold
            hidden
            md:block
            text-lg
            "
          >
            InterviewIQ.AI
          </h1>

        </div>


        {/* ======================
            RIGHT SIDE
        ====================== */}

        <div
          className="
          flex
          items-center
          gap-6
          relative
          "
        >

          {/* ======================
              CREDIT BUTTON
          ====================== */}

          <div className="relative">

            <button
              onClick={() => {

                if (!userData) {
                  setShowAuth(true);
                  return;
                }

                setShowCreditPopup(
                  !showCreditPopup
                );

                setShowUserPopup(false);

              }}

              className="
              flex
              items-center
              gap-2
              bg-gray-100
              px-4
              py-2
              rounded-full
              text-md
              hover:bg-gray-200
              transition
              "
            >

              <BsCoin size={20} />

              <span>
                {userData?.credits || 0}
              </span>

            </button>


            {/* Credit Popup */}

            {showCreditPopup && (

              <div
                className="
                absolute
                right-[-50px]
                mt-3
                w-64
                bg-white
                shadow-xl
                border
                border-gray-200
                rounded-xl
                p-5
                z-50
                "
              >

                <p
                  className="
                  text-sm
                  text-gray-600
                  mb-4
                  "
                >
                  Need more credits to continue interviews?
                </p>

                <button
                  onClick={() => navigate("/pricing")}

                  className="
                  w-full
                  bg-black
                  text-white
                  py-2
                  rounded-lg
                  text-sm
                  "
                >
                  Buy More Credits
                </button>

              </div>

            )}

          </div>


          {/* ======================
              USER BUTTON
          ====================== */}

          <div className="relative">

            <button
              onClick={() => {

                if (!userData) {
                  setShowAuth(true);
                  return;
                }

                setShowUserPopup(
                  !showUserPopup
                );

                setShowCreditPopup(false);

              }}

              className="
              w-9
              h-9
              bg-black
              text-white
              rounded-full
              flex
              items-center
              justify-center
              font-semibold
              "
            >

              {userData ? (

                userData?.name
                  ?.slice(0, 1)
                  .toUpperCase()

              ) : (

                <FaUserAstronaut size={16} />

              )}

            </button>


            {/* User Popup */}

            {showUserPopup && (

              <div
                className="
                absolute
                right-0
                mt-3
                w-48
                bg-white
                shadow-xl
                border
                border-gray-200
                rounded-xl
                p-5
                z-50
                "
              >

                <p
                  className="
                  text-md
                  text-blue-500
                  font-medium
                  mb-1
                  "
                >
                  {userData?.name}
                </p>

                <button
                  onClick={() => navigate("/history")}

                  className="
                  w-full
                  text-left
                  text-sm
                  py-2
                  hover:text-black
                  text-gray-600
                  "
                >
                  Interview History
                </button>

                <button
                  onClick={handleLogOut}

                  className="
                  w-full
                  text-left
                  text-sm
                  py-2
                  flex
                  items-center
                  gap-2
                  text-red-500
                  "
                >

                  <HiOutlineLogout size={16} />

                  Logout

                </button>

              </div>

            )}

          </div>

        </div>

      </motion.div>


      {/* ======================
          AUTH MODAL
      ====================== */}

      {showAuth && (
        <AuthModel
          onClose={() => setShowAuth(false)}
        />
      )}

    </div>
  );
};

export default Navbar;