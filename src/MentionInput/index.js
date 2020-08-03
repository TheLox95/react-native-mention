import React, { Fragment } from 'react'
import ParsedText from 'react-native-parsed-text'
import { Keyboard, TextInput, TouchableOpacity, Text, View } from 'react-native'

import styles from './styles'
import MentionBox, { HEIGHT } from './MentionBox'
import colors from 'react-native-mention/src/constants/colors'

class MentionInput extends React.PureComponent {
  constructor(props) {
    super(props)

    this.mainData = []
    this.cursorPostion = {
      start: 0,
      end: 0
    }

    this.state = {
      text: '',
      showMentionBox: false,
      dataToSearch: this.props.mentionData,
      isInputFieldActive: false,
      mentionBoxDimension: {
        top: 0,
        right: 0,
        width: 0,
        height: HEIGHT
      }
    }
  }

  getUser = () => {
    const words = this.state.text.split(" ")

    return words
      .filter(w => this.props.mentionData.find(d => d.name == w.replace("@", "")))
      .map(w => this.props.mentionData.find(d => d.name == w.replace("@", "")))
  }

  getHashtags = () => {
    const words = this.state.text.split(" ")

    return words
      .filter(w => this.props.hashtagData.find(d => d.name == w.replace("#", "")))
      .map(w => this.props.hashtagData.find(d => d.name == w.replace("#", "")))
  }

  /**
   * Text field on change text event callback
   */
  onChangeText = text => {
    this.setState({ text })
    this.props.onChangeText(text)
    this.mentioningChangeText(text)
  }

  composeData = words => {
    let wordRelativeIndex = 0

    return words.map((word, index) => {
      const hasToMention = word.includes("@") || word.includes("#")
      const wordAbsoluteIndex = index
      const wordLength = word.length
      if (index > 0) {
        wordRelativeIndex = wordRelativeIndex + words[index - 1].length + 1
      }

      return {
        word,
        wordLength,
        hasToMention,
        wordAbsoluteIndex,
        wordRelativeIndex
      }
    })
  }

  checkIfCursorIsAtTheWord = (word, cursor) =>
    cursor.start >= word.wordRelativeIndex + 1 &&
    cursor.start <= word.wordRelativeIndex + word.wordLength

  mentioningChangeText = text => {
    this.splittedText = text.split(" ")
    this.splittedTextCount = this.splittedText.length
    this.mainData = this.composeData(this.splittedText)

    this.mainData = this.mainData.map(item => {
      return {
        ...item,
        isCursorActive: this.checkIfCursorIsAtTheWord(item, this.cursorPostion)
      }
    })

    const wordAtCursor = this.mainData.find(item => item.isCursorActive)

    if (wordAtCursor && wordAtCursor.hasToMention) {
      if (wordAtCursor.word.includes('@')) {
        this.setState({ showMentionBox: true, dataToSearch: this.props.mentionData })
        const words = wordAtCursor.word.split('@')
        this.props.mentioningChangeText(words[words.length - 1])
      } else {
        this.setState({ showMentionBox: true, dataToSearch: this.props.hashtagData })
        const words = wordAtCursor.word.split('')
      }
    } else {
      this.setState({ showMentionBox: false })
    }

    this.lastCursorPosition = this.cursorPostion
  }

  onSelectionChange = ({ nativeEvent }) => {
    this.cursorPostion = nativeEvent.selection
    this.mainData = this.mainData.map(item => {
      return {
        ...item,
        isCursorActive: this.checkIfCursorIsAtTheWord(item, this.cursorPostion)
      }
    })
  }

  onContentSizeChange = ({ nativeEvent }) => {
    this.setState(oldState => ({
      mentionBoxDimension: {
        ...oldState.mentionBoxDimension,
        top: nativeEvent.contentSize.height + 10
      }
    }))
  }

  onCellPress = item => {
    this.setState({ showMentionBox: false })
    this.mainData = this.mainData.map(data => {
      if (data.isCursorActive) {
        const words = data.word.split('@')
        let word = data.word.replace(`@${words[words.length - 1]}`, `@${item.name}`)

        if (data.word.includes('#')) {
          const words = data.word.split('#')
          word = data.word.replace(`#${words[words.length - 1]}`, `#${item.name}`)
          this.props.onHashtagSelected(item)
        } else {
          this.props.onMentionSelected(item)
        }

        return {
          ...data,
          word
        }
      }

      return data
    })

    let combinedText = ''
    this.mainData.forEach((word, index) => {
      const space = index === 0 ? '' : ' '
      combinedText = combinedText + space + word.word
    })
    combinedText = combinedText + ' '
    this.setState({ text: combinedText })
    this.props.onChangeText(combinedText)
  }

  /**
   * Called by fake button that focuses or dismisses the text field.
   */
  toggleTextField = () => {
    this.setState(
      prevState => ({
        isInputFieldActive: !prevState.isInputFieldActive
      }),
      () => {
        this.state.isInputFieldActive
          ? this.inputField.focus()
          : Keyboard.dismiss()
      }
    )
  }

  handleNamePress = text => {
    // console.log('------xxxx', text)
  }

  /**
   * On TextInput layout
   */
  onLayout = ({ nativeEvent }) => {
    // console.log('onLayout', nativeEvent)
    this.setState(oldState => ({
      mentionBoxDimension: {
        ...oldState.mentionBoxDimension,
        width: nativeEvent.layout.width
      }
    }))
  }

  renderText(matchingString, matches) {
    let pattern = /@[A-Za-z0-9._-]*/;
    let match = matchingString.match(pattern);
    return `^^${match[1]}^^`;
  }

  render() {
    return (
      <Fragment>
        <Fragment>
          <TextInput
            multiline
            ref={comp => {
              this.inputField = comp
              this.props.reference(comp)
            }}
            onLayout={this.onLayout}
            onChangeText={this.onChangeText}
            placeholder={this.props.placeholder}
            onSelectionChange={this.onSelectionChange}
            onContentSizeChange={this.onContentSizeChange}
            style={[this.props.inputField, styles.inputField]}
          >
            <ParsedText
              style={styles.text}
              parse={[
                {
                  pattern: /@[A-Za-z0-9._-]*/,
                  onPress: this.handleNamePress,
                  renderText: (matchingString) => {
                    if (this.props.mentionData.find(d => d.name == matchingString.replace('@', ''))) {
                      return <Text style={styles.username}>{matchingString}</Text>
                    }
                    return <Text style={{ color: 'black' }}>{matchingString}</Text>
                  }
                },
                {
                  pattern: /#(\w+)/,
                  renderText: (matchingString) => <Text style={styles.hashTag}>{matchingString}</Text>
                }
              ]}
            >
              {this.state.text}
            </ParsedText>
          </TextInput>
        </Fragment>
        {this.state.showMentionBox && (
          <MentionBox
            isLoading={this.props.isLoading}
            loadingComponent={this.props.loadingComponent}
            data={this.state.dataToSearch}
            style={this.state.mentionBoxDimension}
            renderCell={({ item, index }) => (
              <TouchableOpacity onPress={() => this.onCellPress(item)}>
                {this.props.renderMentionCell({ item, index })}
              </TouchableOpacity>
            )}
          />
        )}
      </Fragment>
    )
  }
}

export default MentionInput 
