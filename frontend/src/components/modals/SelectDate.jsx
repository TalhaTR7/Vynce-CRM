import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "./css/SelectDate.module.scss";
import { useEffect, useRef, useState } from "react";

function SelectDate({ dueDate, onChange, placeholder = "None", disabled }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={styles.inputWrapper}>
            <DatePicker
                selected={dueDate}
                open={isOpen}
                onInputClick={() => setIsOpen(true)}
                dateFormat="MMM d"
                calendarClassName={styles.darkCalendar}
                placeholderText={placeholder}
                disabled={disabled}
                onClickOutside={() => setIsOpen(false)}
                isClearable
                onChange={(date) => {
                    onChange(date);
                    setIsOpen(false);
                }} />
        </div>
    );
}

export default SelectDate;