import { useEffect } from "react";
import { useState } from "react";
import CountdownWrapper from "./Countdown.style";

const Countdown = ({ ...props }) => {
  const [remainingTime, setRemainingTime] = useState({
    seconds: "00",
    minutes: "00",
    hours: "00",
    days: "00",
  });

  useEffect(() => {
    // Fixed end time - same for everyone (set to a specific future date)
    // Change this date to when you want the presale to end
    const endTime = new Date("2025-09-05T23:59:59").getTime(); // March 15, 2025

    const calculateTimeLeft = () => {
      const difference = endTime - Date.now();

      let timeLeft = {};

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        timeLeft = {
          days: String(days).padStart(2, "0"),
          hours: String(hours).padStart(2, "0"),
          minutes: String(minutes).padStart(2, "0"),
          seconds: String(seconds).padStart(2, "0"),
        };
      } else {
        timeLeft = { days: "00", hours: "00", minutes: "00", seconds: "00" };
      }

      return timeLeft;
    };

    setRemainingTime(calculateTimeLeft());

    const timer = setInterval(() => {
      setRemainingTime(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <CountdownWrapper {...props}>
      <div className="count-item">
        <span className="count">{remainingTime.days}</span>
        <span className="label">d</span>
      </div>
      <div className="count-item">
        <span className="count">{remainingTime.hours}</span>
        <span className="label">h</span>
      </div>
      <div className="count-item">
        <span className="count">{remainingTime.minutes}</span>
        <span className="label">m</span>
      </div>
      <div className="count-item">
        <span className="count">{remainingTime.seconds}</span>
        <span className="label">s</span>
      </div>
    </CountdownWrapper>
  );
};

export default Countdown;
