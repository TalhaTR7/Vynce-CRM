import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "../css/SelectDate.module.scss";

function SelectDate({ dueDate, onChange, placeholder = "None" }) {

    return (
        <div className={styles.inputWrapper}>
            <DatePicker
                selected={dueDate}
                onChange={onChange}
                dateFormat="MMM d"
                calendarClassName={styles.darkCalendar}
                placeholderText={placeholder}
                shouldCloseOnSelect
                isClearable
            />
        </div>
    );
}

export default SelectDate;