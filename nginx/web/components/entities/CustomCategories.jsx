import { useEffect, useState } from "react";
import { Platform, View, StyleSheet, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { HelperText, Text } from "react-native-paper";
import GlassyButton from "../custom/GlassyButton";
import theme from "../../assets/themes/theme";
import { capitalize } from "../../utils/text";
import NumericInput from "../custom/NumericInput";

const CATEGORY_PERCENTAGES = {
    "science": 25,
    "history": 25,
    "literature": 20,
    "social science": 10,
    "philosophy": 5,
    "religion": 5,
    "mythology": 5,
    "geography": 5,
}

export default function CustomCategories ({
    players, style
}) {
    const [categoryPercentages, setCategoryPercentages] = useState(CATEGORY_PERCENTAGES)

    const [lastPressed, setLastPressed] = useState(null)
    // Just set it as a category so we have something to alter
    const [nextAlter, setNextAlter] = useState("science")

    useEffect(() => {
        console.log(summateCategories())
    }, [categoryPercentages])

    /*
        ALGORITHM handleCategoryToggle()
        1. IF User increments one category
            - Increment that one category
            - Set lastPressed to that category
                * If lastPressed was changed, then we want to decrement the category below it
            - After decrementing the nextAlter category
                * Set next alter to the next category

        2. IF User puts in value for a category
            - Divide the diff over all categories

        3. Make sure all categories add up to 100

        FUNCTIONS:
            getCategory(category): get the value of a category
            setCategory(category, newNumber): set the category to the new number and save to memory

            summateCategories(): add up all categories
    */

    function getNextCategory(category) {
        const names = Object.keys(CATEGORY_PERCENTAGES)
        const index = names.indexOf(category)
        return index + 1 == names.length ? names[0] : names[index + 1]
    }

    function getNextMutatableCategory(category, avoid, isTaking=true) {
        let nextCat = getNextCategory(category);
        const startCat = category;

        // Loop until we find a category with value > 0
        while ((isTaking && getCategory(nextCat) <= 0) || nextCat === avoid) {
            nextCat = getNextCategory(nextCat);

            // If we looped all the way around without finding one
            if (nextCat === startCat) {
                return null; // no mutatable category
            }
        }

        return nextCat;
    }

    function getCategory(category) {
        return categoryPercentages[category]
    }

    function setCategory(category, newNumber) {
        if(!Object.keys(CATEGORY_PERCENTAGES).includes(category)) return
        setCategoryPercentages((prev) => {
            let newPercentages = {...prev}
            newPercentages[category] = newNumber
            return newPercentages
        })
    }

    function summateCategories() {
        let total = 0;
        for (let value of Object.values(categoryPercentages)) {
            total += value
        }

        return total
    }

    function handleCategoryToggle(category, number) {
        console.log(category, number)
        if(number >= 100) {
            return setCategory(category, 100)
        }
        
        if (!category) {
            throw Error("handleCategoryToggle(): category cannot be undefined")
        }
        const previousValue = getCategory(category)
        const diff = number - previousValue

        // 1. IF User increments one category

        // - Increment that one category
        setCategory(category, number)
        //     * If lastPressed was changed, then we need to set the next alter to the category below it
        if(lastPressed != category) {
            setNextAlter(category)
        }
        // - Set lastPressed to category
        setLastPressed(category)

        // - After decrementing the nextAlter category
        // If they incremented, only alter one category
        let newValue = getCategory(nextAlter) + diff * -1
        if(Math.abs(diff) === 1) {
            setCategory(nextAlter, newValue)
            //     * Set next alter to the next category that is not the mutated category
            const nextCategory = getNextMutatableCategory(nextAlter, category, diff * -1 > 0 ? false : true)
            if(!nextCategory) return
            setNextAlter(nextCategory)
        }
        // If the diff is not a simple increment
        else {
            let amountDiff = Math.abs(diff)

            for(let i = 0; i < amountDiff; i++) {
                newValue = getCategory(nextAlter) + Math.sign(diff) * -1
                setCategory(nextAlter, getCategory(nextAlter) + diff * -1)
                //     * Set next alter to the next category
                const nextCategory = getNextMutatableCategory(nextAlter, category, diff * -1 > 0 ? false : true)
                if(!nextCategory) return
                setNextAlter(nextCategory)
            }
        }

    }

    return (
        <View style={[styles.container, style]}>
            {
                Object.entries(categoryPercentages).map(([key, value], index) => 
                    <View style={styles.category}>
                        <HelperText>{capitalize(key)}</HelperText>
                        <NumericInput
                            size={0.8}
                            style={styles.numeric}
                            defaultValue={value}
                            onChange={(number) => handleCategoryToggle(key, number)}
                            minimum={0}
                            maximum={100}
                        />
                    </View>
                )
            }
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.background,
        borderRadius: 5,
        padding: 5,
    },
    category: {
        flexDirection: "row",
        justifyContent: "space-between"
    },
    numeric: {
        borderLeftWidth: 1,
        borderColor: theme.surfaceContainerHigh
    }
})